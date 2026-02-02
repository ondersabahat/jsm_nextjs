"use server";

import Answer, { IAnswerDoc } from "@/database/answer.model";
import action from "../handlers/action";
import handleError from "../handlers/error";
import { AnswerServerSchema, DeleteAnswerSchema, GetAnswersSchema } from "../validations";
import mongoose from "mongoose";
import { NotFoundError, UnauthorizedError } from "../http-errors";
import { Question, Vote } from "@/database";
import { revalidatePath } from "next/cache";
import ROUTES from "@/constants/routes";

export async function createAnswer(params: CreateAnswerParams): Promise<ActionResponse<IAnswerDoc>> {
  const validationResult = await action({
    schema: AnswerServerSchema,
    params,
    authorize: true,
  });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const { questionId, content } = validationResult.params!;
  const userId = validationResult?.session?.user?.id;

  const session = await mongoose.startSession();

  session.startTransaction();

  try {
    const question = await Question.findById(questionId);

    if (!question) {
      throw new NotFoundError("Question not found");
    }

    const [newAnswer] = await Answer.create(
      [
        {
          question: questionId,
          content,
          author: userId,
        },
      ],
      { session }
    );

    if (!newAnswer) {
      throw new Error("Failed to create answer");
    }

    question.answers += 1;
    await question.save({ session });

    await session.commitTransaction();
    revalidatePath(ROUTES.QUESTIONS(questionId));

    return { success: true, data: JSON.parse(JSON.stringify(newAnswer)) };
  } catch (error) {
    await session.abortTransaction();
    return handleError(error) as ErrorResponse;
  } finally {
    await session.endSession();
  }
}

export async function getAnswers(params: GetAnswersParams): Promise<
  ActionResponse<{
    answers: Answer[];
    totalAnswers: number;
    isNext: boolean;
  }>
> {
  const validationResult = await action({
    schema: GetAnswersSchema,
    params,
  });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const { questionId, page = 1, pageSize = 10, filter } = validationResult.params!;

  const skip = (Number(page) - 1) * Number(pageSize);
  const limit = Number(pageSize);

  let sortCriteria = {};

  switch (filter) {
    case "latest":
      sortCriteria = { createdAt: -1 };
      break;
    case "oldest":
      sortCriteria = { createdAt: 1 };
      break;
    case "popular":
      sortCriteria = { upvotes: -1 };
      break;
    default:
      sortCriteria = { createdAt: -1 };
  }

  try {
    const totalAnswers = await Answer.countDocuments({ question: questionId });
    const answers = await Answer.find({ question: questionId })
      .populate("author", "name image _id")
      .sort(sortCriteria)
      .skip(skip)
      .limit(limit);

    const isNext = totalAnswers > skip + answers.length;

    return { success: true, data: { answers: JSON.parse(JSON.stringify(answers)), totalAnswers, isNext } };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function deleteAnswer(params: DeleteAnswerParams): Promise<ActionResponse> {
  const validationResult = await action({
    schema: DeleteAnswerSchema,
    params,
    authorize: true,
  });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const { answerId } = validationResult.params!;
  const { user } = validationResult.session!;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const answer = await Answer.findById(answerId).session(session);

    if (!answer) {
      throw new NotFoundError("Answer not found");
    }

    if (answer.author.toString() !== user?.id) {
      throw new Error("You are not authorized to delete this answer");
    }

    await Question.findByIdAndUpdate(answer.question, { $inc: { answers: -1 } }, { new: true, session });

    await Vote.deleteMany({ actionId: answerId, actionType: "answer" }).session(session);
    await Answer.findByIdAndDelete(answerId).session(session);

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
