"use client";

import Image from "next/image";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import ROUTES from "@/constants/routes";
import { deleteQuestion } from "@/lib/actions/question.action";
import { deleteAnswer } from "@/lib/actions/answer.action";

interface Props {
  type: "question" | "answer";
  itemId: string;
}
const EditDeleteAction = ({ type, itemId }: Props) => {
  const router = useRouter();
  const handleEdit = () => {
    router.push(ROUTES.EDIT(itemId));
  };
  const handleDelete = async () => {
    if (type === "question") {
      await deleteQuestion({ questionId: itemId });
      toast.success("Question deleted successfully", {
        description: "your question has been deleted successfully",
      });
    } else if (type === "answer") {
      await deleteAnswer({ answerId: itemId });
      toast.success("Answer deleted successfully", {
        description: "your answer has been deleted successfully",
      });
    }
  };
  return (
    <div className={`flex items-center justify-end gap-3 max-sm:w-full ${type === "answer" && "justify-center gap-0"}`}>
      {type === "question" && (
        <Image
          src="/icons/edit.svg"
          alt="edit"
          width={14}
          height={14}
          className="cursor-pointer object-contain"
          onClick={handleEdit}
        />
      )}
      <AlertDialog>
        <AlertDialogTrigger className="cursor-pointer">
          <Image src="/icons/trash.svg" alt="trash" width={14} height={14} className="" />
        </AlertDialogTrigger>
        <AlertDialogContent className="background-light800_dark300">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your{" "}
              {type === "question" ? "question" : "answer"} and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="btn">Cancel</AlertDialogCancel>
            <AlertDialogAction className="!border-primary-100 !bg-primary-500 !text-light-800" onClick={handleDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EditDeleteAction;
