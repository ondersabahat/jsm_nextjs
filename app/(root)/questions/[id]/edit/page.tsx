import QuestionForm from "@/components/forms/QuestionForm";
import { auth } from "@/auth";
import ROUTES from "@/constants/routes";
import { notFound, redirect } from "next/navigation";
import { getQuestion } from "@/lib/actions/question.action";

const EditQuestionPage = async ({ params }: RouteParams) => {
  const { id } = await params;
  if (!id) {
    return notFound();
  }
  const session = await auth();

  if (!session) {
    redirect(ROUTES.SIGN_IN);
  }

  const { data: question, success } = await getQuestion({ questionId: id });

  if (!success) {
    return notFound();
  }

  if (question?.author._id.toString() !== session.user?.id) {
    return redirect(ROUTES.QUESTIONS(id));
  }

  return (
    <main>
      <QuestionForm question={question} isEdit />
    </main>
  );
};

export default EditQuestionPage;
