"use server";

import ROUTES from "@/constants/routes";
import { Vote } from "@/database";
import Answer from "@/database/answer.model";
import Question from "@/database/question.model";
import mongoose, { ClientSession } from "mongoose";
import { revalidatePath } from "next/cache";
import action from "../handlers/action";
import handleError from "../handlers/error";
import { CreateVoteSchema, HasVotedSchema, UpdateVoteCountSchema } from "../validations";
import { createInteraction } from "./interaction.action";
import { after } from "next/server";

export async function updateVoteCount(params: UpdateVoteCountParams, session?: ClientSession): Promise<ActionResponse> {
  const validationResult = await action({
    schema: UpdateVoteCountSchema,
    params,
  });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const { targetId, targetType, voteType, change } = validationResult.params!;

  const model = targetType === "question" ? Question : Answer;
  const voteField = voteType === "upvote" ? "upvotes" : "downvotes";

  try {
    const result = await model.findByIdAndUpdate(targetId, { $inc: { [voteField]: change } }, { new: true, session });
    if (!result) handleError(new Error("Failed to update vote count")) as ErrorResponse;

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function createVote(params: CreateVoteParams): Promise<ActionResponse> {
  const validationResult = await action({
    schema: CreateVoteSchema,
    params,
    authorize: true,
  });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const { targetId, targetType, voteType } = validationResult.params!;
  const userId = validationResult.session?.user?.id;

  if (!userId) return handleError(new Error("Unauthorized")) as ErrorResponse;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const Model = targetType === "question" ? Question : Answer;
    const contentDoc = await Model.findById(targetId).session(session);
    if (!contentDoc) handleError(new Error("Content not found")) as ErrorResponse;

    const contentAuthorId = contentDoc.author.toString();

    const existingVote = await Vote.findOne({
      author: userId,
      actionId: targetId,
      actionType: targetType,
    }).session(session);

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        await Vote.deleteOne({ _id: existingVote._id }).session(session);
        await updateVoteCount({ targetId, targetType, voteType, change: -1 }, session);
      } else {
        await Vote.findByIdAndUpdate(existingVote._id, { voteType }, { new: true, session });
        await updateVoteCount({ targetId, targetType, voteType: existingVote.voteType, change: -1 }, session);
        await updateVoteCount({ targetId, targetType, voteType, change: 1 }, session);
      }
    } else {
      await Vote.create([{ author: userId, actionId: targetId, actionType: targetType, voteType }], { session });
      await updateVoteCount({ targetId, targetType, voteType, change: 1 }, session);
    }

    after(async () => {
      await createInteraction({
        action: voteType,
        actionTarget: targetType,
        actionId: targetId,
        authorId: contentAuthorId,
      });
    });

    await session.commitTransaction();

    revalidatePath(ROUTES.QUESTIONS(targetId));
    return {
      success: true,
    };
  } catch (error) {
    await session.abortTransaction();
    return handleError(error) as ErrorResponse;
  } finally {
    await session.endSession();
  }
}

export async function hasVoted(params: HasVotedParams): Promise<ActionResponse<HasVotedResponse>> {
  const validationResult = await action({
    schema: HasVotedSchema,
    params,
    authorize: true,
  });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const { targetId, targetType } = validationResult.params!;
  const userId = validationResult.session?.user?.id;

  try {
    const vote = await Vote.findOne({
      author: userId,
      actionId: targetId,
      actionType: targetType,
    });

    if (!vote) {
      return { success: false, data: { hasUpVoted: false, hasDownVoted: false } };
    }

    return {
      success: true,
      data: { hasUpVoted: vote.voteType === "upvote", hasDownVoted: vote.voteType === "downvote" },
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}
