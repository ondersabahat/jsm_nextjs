"use server";

import Question, { IQuestionDoc } from "@/database/question.model";
import TagQuestion from "@/database/tag-question.model";
import Tag, { ITagDoc } from "@/database/tag.model";
import mongoose, { QueryFilter, Types } from "mongoose";
import action from "../handlers/action";
import handleError from "../handlers/error";
import {
  AskQuestionSchema,
  DeleteQuestionSchema,
  EditQuestionSchema,
  GetQuestionSchema,
  IncrementViewsSchema,
  PaginatedSearchParamsSchema,
} from "../validations";
import dbConnect from "../mongoose";
import { success } from "zod";
import { UnauthorizedError } from "../http-errors";
import { Answer, Collection, Interaction, Vote } from "@/database";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { createInteraction } from "./interaction.action";
import { auth } from "@/auth";
import { cache } from "react";

export async function createQuestion(params: CreateQuestionParams): Promise<ActionResponse<Question>> {
  const validationResult = await action({
    schema: AskQuestionSchema,
    params,
    authorize: true,
  });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const { title, content, tags } = validationResult.params!;
  const userId = validationResult?.session?.user?.id;

  const session = await mongoose.startSession();

  session.startTransaction();

  try {
    const [question] = await Question.create(
      [
        {
          title,
          content,
          author: userId,
        },
      ],
      { session }
    );

    if (!question) {
      throw new Error("Failed to create question");
    }

    const tagIds: mongoose.Types.ObjectId[] = [];
    const tagQuestionDocuments = [];

    for (const tag of tags) {
      const existingTag = await Tag.findOneAndUpdate(
        { name: { $regex: new RegExp(`^${tag}$`, "i") } },
        { $setOnInsert: { name: tag }, $inc: { questions: 1 } },
        { upsert: true, new: true, session }
      );
      tagIds.push(existingTag?._id);
      tagQuestionDocuments.push({ tag: existingTag?._id, question: question._id });
    }

    console.log("Tag Question Documents: ", tagQuestionDocuments);

    await TagQuestion.insertMany(tagQuestionDocuments, { session });

    await Question.findByIdAndUpdate(question._id, { $push: { tags: { $each: tagIds } } }, { session });

    after(async () => {
      await createInteraction({
        action: "post",
        actionTarget: "question",
        actionId: question._id.toString(),
        authorId: userId as string,
      });
    });

    await session.commitTransaction();

    return {
      success: true,
      data: JSON.parse(JSON.stringify(question)),
    };
  } catch (error) {
    await session.abortTransaction();
    return handleError(error) as ErrorResponse;
  } finally {
    await session.endSession();
  }
}

export async function editQuestion(params: EditQuestionParams): Promise<ActionResponse<IQuestionDoc>> {
  const validationResult = await action({
    schema: EditQuestionSchema,
    params,
    authorize: true,
  });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const { title, content, tags, questionId } = validationResult.params!;
  const userId = validationResult?.session?.user?.id;

  const session = await mongoose.startSession();

  session.startTransaction();

  try {
    const question = await Question.findById(questionId).populate("tags");

    if (!question) {
      throw new Error("Question not found");
    }

    if (question.author.toString() !== userId) {
      throw new Error("You are not authorized to edit this question");
    }

    if (question.title !== title || question.content !== content) {
      question.title = title;
      question.content = content;
      await question.save({ session });
    }

    const tagsToAdd = tags.filter(
      (tag) => !question.tags.some((t: ITagDoc) => t.name.toLowerCase().includes(tag.toLowerCase()))
    );
    const tagsToRemove = question.tags.filter(
      (tag: ITagDoc) => !tags.some((t: string) => t.toLowerCase().includes(tag.name.toLowerCase()))
    );

    const newTagDocuments = [];

    if (tagsToAdd.length > 0) {
      for (const tag of tagsToAdd) {
        const existingTag = await Tag.findOneAndUpdate(
          { name: { $regex: `^${tag}$`, $options: "i" } },
          { $setOnInsert: { name: tag }, $inc: { questions: 1 } },
          { upsert: true, new: true, session }
        );
        if (existingTag) {
          newTagDocuments.push({ tag: existingTag._id, question: questionId });
          question.tags.push(existingTag._id);
        }
      }
    }

    if (tagsToRemove.length > 0) {
      const tagIdsToRemove = tagsToRemove.map((tag: ITagDoc) => tag._id);
      await Tag.updateMany({ _id: { $in: tagIdsToRemove } }, { $inc: { questions: -1 } }, { session });
      await TagQuestion.deleteMany({ tag: { $in: tagIdsToRemove }, question: questionId }, { session });
      question.tags = question.tags.filter(
        (tag: mongoose.Types.ObjectId) => !tagIdsToRemove.some((id: mongoose.Types.ObjectId) => id.equals(tag._id))
      );
    }

    if (newTagDocuments.length > 0) {
      await TagQuestion.insertMany(newTagDocuments, { session });
    }

    await question.save({ session });

    await session.commitTransaction();

    return {
      success: true,
      data: JSON.parse(JSON.stringify(question)),
    };
  } catch (error) {
    await session.abortTransaction();
    return handleError(error) as ErrorResponse;
  } finally {
    await session.endSession();
  }
}

export const getQuestion = cache(async (params: GetQuestionParams): Promise<ActionResponse<Question>> => {
  const validationResult = await action({
    schema: GetQuestionSchema,
    params,
    authorize: true,
  });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const { questionId } = validationResult.params!;

  try {
    const question = await Question.findById(questionId).populate("tags").populate("author", "_id name image");

    if (!question) {
      throw new Error("Question not found");
    }

    return {
      success: true,
      data: JSON.parse(JSON.stringify(question)),
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
});

export async function getQuestions(
  params: PaginatedSearchParams
): Promise<ActionResponse<{ questions: Question[]; isNext: boolean }>> {
  const validationResult = await action({
    params,
    schema: PaginatedSearchParamsSchema,
  });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const { page = 1, pageSize = 10, query, filter } = validationResult.params!;

  const skip = (Number(page) - 1) * Number(pageSize);
  const limit = Number(pageSize);

  const filterQuery: QueryFilter<typeof Question> = {};
  let sortCriteria = {};

  try {
    if (filter === "recommended") {
      const session = await auth();
      const userId = session?.user?.id;

      if (!userId) {
        return { success: true, data: { questions: [], isNext: false } };
      }

      const recommended = await getRecommendedQuestions({ userId, query, skip, limit });

      return { success: true, data: recommended };
    }

    if (query) {
      filterQuery.$or = [{ title: { $regex: query, $options: "i" } }, { content: { $regex: query, $options: "i" } }];
    }

    switch (filter) {
      case "newest":
        sortCriteria = { createdAt: -1 };
        break;
      case "unanswered":
        filterQuery.answers = 0;
        sortCriteria = { createdAt: -1 };
        break;
      case "popular":
        sortCriteria = { upvotes: -1 };
        break;
      default:
        sortCriteria = { createdAt: -1 };
        break;
    }

    const totalQuestions = await Question.countDocuments(filterQuery);

    const questions = await Question.find(filterQuery)
      .populate("tags", "name")
      .populate("author", "name image")
      .lean()
      .sort(sortCriteria)
      .skip(skip)
      .limit(limit);

    const isNext = totalQuestions > skip + questions.length;

    return { success: true, data: { questions: JSON.parse(JSON.stringify(questions)), isNext } };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function incrementViews(params: IncrementViewsParams): Promise<ActionResponse<{ views: number }>> {
  const validationResult = await action({
    schema: IncrementViewsSchema,
    params,
    authorize: false,
  });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const { questionId } = validationResult.params!;

  try {
    const question = await Question.findById(questionId);

    if (!question) {
      throw new Error("Question not found");
    }

    question.views += 1;
    await question.save();

    return { success: true, data: { views: question.views } };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function getHotQuestions(): Promise<ActionResponse<Question[]>> {
  try {
    await dbConnect();

    const questions = await Question.find().sort({ views: -1, upvotes: -1 }).limit(5);

    return {
      success: true,
      data: JSON.parse(JSON.stringify(questions)),
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function deleteQuestion(params: DeleteQuestionParams): Promise<ActionResponse> {
  const validationResult = await action({
    schema: DeleteQuestionSchema,
    params,
    authorize: true,
  });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const { questionId } = validationResult.params!;
  const { user } = validationResult.session!;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const question = await Question.findById(questionId).session(session);

    if (!question) {
      throw new Error("Question not found");
    }
    if (question?.author._id.toString() !== user?.id) {
      throw new Error("You are not authorized to delete this question");
    }

    await Collection.deleteMany({ question: questionId }).session(session);

    await TagQuestion.deleteMany({ question: questionId }).session(session);

    if (question.tags.length > 0) {
      await Tag.updateMany({ _id: { $in: question.tags } }, { $inc: { questions: -1 } }, { session });
    }

    await Vote.deleteMany({ actionId: questionId, actionType: "question" }).session(session);

    const answers = await Answer.find({ question: questionId }).session(session);

    if (answers.length > 0) {
      await Answer.deleteMany({ question: questionId }).session(session);
      await Vote.deleteMany({ actionId: { $in: answers.map((answer) => answer._id) }, actionType: "answer" }).session(
        session
      );
    }

    await Question.findByIdAndDelete(questionId).session(session);

    await session.commitTransaction();

    revalidatePath(`/profile/${user?.id}`);

    return { success: true };
  } catch (error) {
    await session.abortTransaction();
    return handleError(error) as ErrorResponse;
  } finally {
    await session.endSession();
  }
}

export async function getRecommendedQuestions({ userId, query, skip, limit }: RecommendationParams) {
  const interactions = await Interaction.find({
    user: new Types.ObjectId(userId),
    actionType: "question",
    action: { $in: ["view", "upvote", "bookmark", "post"] },
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(50)
    .lean();

  const interactionQuestionIds = interactions.map((interaction) => interaction.actionId);

  const interactionQuestions = await Question.find({
    _id: { $in: interactionQuestionIds },
  }).select("tags");

  const allTags = interactionQuestions.flatMap((q) => q.tags.map((tag: Types.ObjectId) => Tag.toString()));

  const uniqueTagIds = [...new Set(allTags)];

  const recommendedQuery: QueryFilter<typeof Question> = {
    _id: { $nin: interactionQuestionIds },
    author: { $ne: new Types.ObjectId(userId) },
    tags: { $in: uniqueTagIds.map((id) => new Types.ObjectId(id)) },
  };

  if (query) {
    recommendedQuery.$or = [{ title: { $regex: query, $options: "i" } }, { content: { $regex: query, $options: "i" } }];
  }

  const total = await Question.countDocuments(recommendedQuery);

  const questions = await Question.find(recommendedQuery)
    .populate("tags", "name")
    .populate("author", "name image")
    .sort({ upvotes: -1, views: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return {
    questions: JSON.parse(JSON.stringify(questions)),
    isNext: total > skip + questions.length,
  };
}
