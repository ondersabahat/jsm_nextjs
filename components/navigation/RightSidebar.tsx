import ROUTES from "@/constants/routes";
import { getHotQuestions } from "@/lib/actions/question.action";
import Image from "next/image";
import Link from "next/link";
import DataRenderer from "../DataRenderer";
import { getTopTags } from "@/lib/actions/tag.action";
import TagCard from "../cards/TagCard";

const RightSidebar = async () => {
  // const { success, data: hotQuestions, error } = await getHotQuestions();
  // const { success: tagsSuccess, data: tags, error: tagsError } = await getTopTags();

  const [{ success, data: hotQuestions, error }, { success: tagsSuccess, data: tags, error: tagsError }] =
    await Promise.all([getHotQuestions(), getTopTags()]);

  return (
    <section className="custom-scrollbar background-light900_dark200 shadow-light-300 sticky top-0 right-0 flex h-screen w-87.5 flex-col gap-6 overflow-y-auto border-l p-6 pt-36 max-xl:hidden dark:shadow-none">
      <div>
        <h3 className="h3-bold text-dark200_light900">Top Questions</h3>

        <DataRenderer
          data={hotQuestions}
          empty={{
            title: "No questions found",
            message: "No questions have been asked yet.",
          }}
          success={success}
          error={error}
          render={(hotQuestions) => (
            <div className="mt-7 flex w-full flex-col gap-[30px]">
              {hotQuestions.map(({ _id, title }) => (
                <Link
                  key={_id}
                  href={ROUTES.QUESTIONS(_id)}
                  className="flex cursor-pointer items-center justify-between gap-7"
                >
                  <p className="body-medium text-dark500_light700 line-clamp-2">{title}</p>

                  <Image
                    src="/icons/chevron-right.svg"
                    alt="Chevron"
                    width={20}
                    height={20}
                    className="invert-colors"
                  />
                </Link>
              ))}
            </div>
          )}
        />
      </div>
      <div className="mt-16">
        <h3 className="h3-bold text-dark200_light900">Popular Tags</h3>
        <DataRenderer
          data={tags}
          empty={{
            title: "No tags found",
            message: "No tags have been created yet.",
          }}
          success={tagsSuccess}
          error={tagsError}
          render={(tags) => (
            <div className="mt-7 flex flex-col gap-4">
              {tags.map(({ _id, name, questions }: Tag) => (
                <TagCard key={_id} _id={_id} name={name} compact showCount questions={questions} />
              ))}
            </div>
          )}
        />
      </div>
    </section>
  );
};

export default RightSidebar;
