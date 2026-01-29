import AllAnswers from "@/components/answers/AllAnswers";
import TagCard from "@/components/cards/TagCard";
import Preview from "@/components/editor/preview";
import AnswerForm from "@/components/forms/AnswerForm";
import Metric from "@/components/Metrics";
import SaveQuestion from "@/components/questions/SaveQuestion";
import UserAvatar from "@/components/UserAvatar";
import Votes from "@/components/votes/Votes";
import ROUTES from "@/constants/routes";
import { getAnswers } from "@/lib/actions/answer.action";
import { hasSavedQuestion } from "@/lib/actions/collection.action";
import { getQuestion, incrementViews } from "@/lib/actions/question.action";
import { hasVoted } from "@/lib/actions/vote.action";
import { formatNumber, getTimeStamp } from "@/lib/utils";
import Link from "next/link";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { Suspense } from "react";

const QuestionDetails = async ({ params, searchParams }: RouteParams) => {
  const { id } = await params;
  const { filter, page, pageSize } = await searchParams;
  const { data: question, success } = await getQuestion({ questionId: id });

  after(async () => {
    await incrementViews({ questionId: id });
  });

  // await incrementViews({ questionId: id });

  if (!success || !question) {
    return redirect("/404");
  }

  const {
    data: answersResult,
    success: areAnswersLoaded,
    error: answersError,
  } = await getAnswers({
    questionId: id,
    page: Number(page) || 1,
    pageSize: 10,
    filter: filter || "latest",
  });

  if (!areAnswersLoaded || !answersResult) {
    return redirect("/404");
  }

  const hasVotedPromise = hasVoted({ targetId: question._id, targetType: "question" });
  const hasSavedQuestionPromise = hasSavedQuestion({ questionId: question._id });

  const { author, createdAt, answers, views, tags, title, content, upvotes, downvotes } = question;

  return (
    <>
      <div className="flex-start w-full flex-col">
        <div className="flex w-full flex-col-reverse justify-between">
          <div className="flex items-center justify-start gap-1">
            <UserAvatar id={author._id} name={author.name} className="size-[22px]" fallbackClassName="text-[10px]" />
            <Link href={ROUTES.PROFILE(author._id)}>
              <p className="paragraph-semibold text-dark300_light700">{author.name}</p>
            </Link>
          </div>
          <div className="flex items-center justify-end gap-4">
            <Suspense fallback={<div>Loading...</div>}>
              <Votes
                upvotes={upvotes}
                downvotes={downvotes}
                hasVotedPromise={hasVotedPromise}
                targetId={question._id}
                targetType="question"
              />
            </Suspense>
            <Suspense fallback={<div>Loading...</div>}>
              <SaveQuestion questionId={question._id} hasSavedQuestionPromise={hasSavedQuestionPromise} />
            </Suspense>
          </div>
        </div>
        <h2 className="h2-semibold text-dark200_light900 mt-3.5 w-full">{title}</h2>
      </div>
      <div className="mt-5 mb-8 flex flex-wrap gap-4">
        <Metric
          imgUrl="/icons/clock.svg"
          alt="Clock icon"
          value={`asked ${getTimeStamp(new Date(createdAt))}`}
          title=""
          textStyles="small-regular text-dark400_light700"
        />
        <Metric
          imgUrl="/icons/message.svg"
          alt="Message icon"
          value={answers}
          title=""
          textStyles="small-regular text-dark400_light700"
        />
        <Metric
          imgUrl="/icons/eye.svg"
          alt="Eye icon"
          value={formatNumber(views)}
          title=""
          textStyles="small-regular text-dark400_light700"
        />
      </div>
      <Preview content={content} />
      <div className="mt-8 flex flex-wrap gap-2">
        {tags.map((tag: Tag) => (
          <TagCard key={tag._id} _id={tag._id as string} name={tag.name} compact />
        ))}
      </div>

      <section className="my-5">
        <AllAnswers
          data={answersResult?.answers}
          success={areAnswersLoaded}
          error={answersError}
          totalAnswers={answersResult?.totalAnswers || 0}
          page={Number(page) || 1}
          isNext={answersResult?.isNext || false}
        />
      </section>

      <section className="my-5">
        <AnswerForm questionId={question._id} questionTitle={title} questionContent={content} />
      </section>
    </>
  );
};

export default QuestionDetails;
