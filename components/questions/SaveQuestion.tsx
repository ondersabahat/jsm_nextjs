"use client";

import { toggleSaveQuestion } from "@/lib/actions/collection.action";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { use, useState } from "react";
import { toast } from "sonner";

const SaveQuestion = ({
  questionId,
  hasSavedQuestionPromise,
}: {
  questionId: string;
  hasSavedQuestionPromise: Promise<ActionResponse<{ saved: boolean }>>;
}) => {
  const session = useSession();
  const userId = session.data?.user?.id;

  const [isLoading, setIsLoading] = useState(false);

  const { data } = use(hasSavedQuestionPromise);

  const { saved: hasSaved } = data || {};

  const handleSave = async () => {
    if (isLoading) return;

    if (!userId) {
      return toast.error("You must be logged in to save a question");
    }

    setIsLoading(true);
    try {
      const { success, data, error } = await toggleSaveQuestion({ questionId });
      if (!success) {
        toast.error(error instanceof Error ? error.message : "An error occurred while saving the question");
      }
      toast.success(data?.saved ? "Question saved" : "Question removed from collection");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred while saving the question");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Image
      src={hasSaved ? "/icons/star-filled.svg" : "/icons/star-red.svg"}
      alt="save"
      width={18}
      height={18}
      className={`cursor-pointer ${isLoading && "opacity-50"}`}
      aria-label="save question"
      onClick={handleSave}
    />
  );
};

export default SaveQuestion;
