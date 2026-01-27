"use server";

import { Collection, Question } from "@/database";
import action from "../handlers/action";
import handleError from "../handlers/error";
import { CollectionBaseSchema, PaginatedSearchParamsSchema } from "../validations";
import ROUTES from "@/constants/routes";
import { revalidatePath } from "next/cache";
import { skip } from "node:test";
import { PipelineStage, QueryFilter } from "mongoose";
import mongoose from "mongoose";

export async function toggleSaveQuestion(params: CollectionBaseParams): Promise<ActionResponse<{ saved: boolean }>> {
  const validationResult = await action({
    params,
    schema: CollectionBaseSchema,
    authorize: true,
  });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const { questionId } = validationResult.params!;

  const userId = validationResult.session?.user?.id;

  if (!userId) return handleError(new Error("Unauthorized")) as ErrorResponse;

  try {
    const question = await Question.findById(questionId);
    if (!question) return handleError(new Error("Question not found")) as ErrorResponse;

    const collection = await Collection.findOne({ author: userId, question: questionId });

    if (collection) {
      await Collection.findByIdAndDelete(collection._id);
      revalidatePath(ROUTES.QUESTIONS(questionId));
      return { success: true, data: { saved: false } };
    }

    await Collection.create({ author: userId, question: questionId });
    revalidatePath(ROUTES.QUESTIONS(questionId));
    return { success: true, data: { saved: true } };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}
export async function hasSavedQuestion(params: CollectionBaseParams): Promise<ActionResponse<{ saved: boolean }>> {
  const validationResult = await action({
    params,
    schema: CollectionBaseSchema,
    authorize: true,
  });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const { questionId } = validationResult.params!;

  const userId = validationResult.session?.user?.id;

  if (!userId) return handleError(new Error("Unauthorized")) as ErrorResponse;

  try {
    const collection = await Collection.findOne({ author: userId, question: questionId });

    return { success: true, data: { saved: !!collection } };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function getSavedQuestions(
  params: PaginatedSearchParams
): Promise<ActionResponse<{ collection: Collection[]; isNext: boolean }>> {
  const validationResult = await action({
    params,
    schema: PaginatedSearchParamsSchema,
    authorize: true,
  });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const userId = validationResult.session?.user?.id;
  const { page = 1, pageSize = 10, query, filter } = params;
  const skip = (Number(page) - 1) * pageSize;
  const limit = Number(pageSize);

  const filterQuery: QueryFilter<typeof Collection> = { author: userId };

  if (query) {
    filterQuery.$or = [{ title: { $regex: new RegExp(query, "i") } }, { content: { $regex: new RegExp(query, "i") } }];
  }

  let sortCriteria = {};

  switch (filter) {
    case "mostrecent":
      sortCriteria = { createdAt: -1 };
      break;
    case "oldest":
      sortCriteria = { createdAt: -1 };
      break;
    case "mostvoted":
      sortCriteria = { upvotes: -1 };
      break;
    case "mostanswered":
      sortCriteria = { answers: -1 };
      break;
    default:
      sortCriteria = { createdAt: -1 };
      break;
  }

  try {
    const totalQuestions = await Question.countDocuments(filterQuery);

    const questions = await Collection.find(filterQuery)
      .populate({
        path: "question",
        populate: [
          { path: "tags", select: "_id name" },
          { path: "author", select: "_id name image" },
        ],
      })
      .sort(sortCriteria)
      .skip(skip)
      .limit(limit);

    const isNext = totalQuestions > skip + questions.length;

    return {
      success: true,
      data: { collection: JSON.parse(JSON.stringify(questions)), isNext },
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}
