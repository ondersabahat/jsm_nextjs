"use client";

import { createVote } from "@/lib/actions/vote.action";
import { formatNumber } from "@/lib/utils";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { use, useState } from "react";
import { toast } from "sonner";

interface Props {
  upvotes: number;
  downvotes: number;
  hasVotedPromise: Promise<ActionResponse<HasVotedResponse>>;
  targetId: string;
  targetType: "question" | "answer";
}

const Votes = ({ upvotes, downvotes, hasVotedPromise, targetId, targetType }: Props) => {
  const session = useSession();

  const userId = session.data?.user?.id;
  const { success, data } = use(hasVotedPromise);

  const { hasUpVoted, hasDownVoted } = data || {};

  const [isLoading, setIsLoading] = useState(false);
  const handleVote = async (voteType: "upvote" | "downvote") => {
    if (!userId) {
      return toast.error("Please sign in to vote");
    }
    setIsLoading(true);

    const successMessage =
      voteType === "upvote"
        ? `Upvote ${!hasUpVoted ? "added" : "removed"} successfully`
        : `Downvote ${!hasDownVoted ? "added" : "removed"} successfully`;

    toast.success(successMessage);

    try {
      const result = await createVote({ targetId, targetType, voteType });
      if (!result.success) {
        toast.error(result.error?.message || "An error occurred while voting");
      }
      toast.success(successMessage);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred while voting");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="flex-center gap-2.5">
      <div className="flex-center gap-1.5">
        <Image
          src={success && hasUpVoted ? "/icons/upvoted.svg" : "/icons/upvote.svg"}
          alt="upvote"
          width={18}
          height={18}
          className={`cursor-pointer ${isLoading && "opacity-50"}`}
          aria-label="upvote"
          onClick={() => !isLoading && handleVote("upvote")}
        />
        <div className="flex-center background-light700_dark400 min-w-5 rounded-sm p-1">
          <p className="subtle-medium text-dark400_light900">{formatNumber(upvotes)}</p>
        </div>
      </div>
      <div className="flex-center gap-1.5">
        <Image
          src={success && hasDownVoted ? "/icons/downvoted.svg" : "/icons/downvote.svg"}
          alt="downvote"
          width={18}
          height={18}
          className={`cursor-pointer ${isLoading && "opacity-50"}`}
          aria-label="downvote"
          onClick={() => !isLoading && handleVote("downvote")}
        />
        <div className="flex-center background-light700_dark400 min-w-5 rounded-sm p-1">
          <p className="subtle-medium text-dark400_light900">{formatNumber(downvotes)}</p>
        </div>
      </div>
    </div>
  );
};

export default Votes;
