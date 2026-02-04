import { AnswerFilters } from "@/constants/filters";
import { EMPTY_ANSWERS } from "@/constants/states";
import AnswerCard from "../cards/AnswerCard";
import DataRenderer from "../DataRenderer";
import CommonFilter from "../filters/CommonFilter";
import Pagination from "../Pagination";
import { ActionResponse } from "@/types/global";

interface Props extends ActionResponse<Answer[]> {
  totalAnswers: number;
  page: number;
  isNext: boolean;
}

const AllAnswers = ({ data, success, error, totalAnswers, page, isNext }: Props) => {
  return (
    <div className="mt-11">
      <div className="flex items-center justify-between">
        <h3 className="primary-text-gradient">
          {totalAnswers === 1 ? `${totalAnswers} Answer` : `${totalAnswers} Answers`}
        </h3>
        <CommonFilter filters={AnswerFilters} otherClasses="min-h-[56px] sm:min-w-[170px]" />
      </div>
      <DataRenderer<Answer>
        data={data}
        success={success}
        error={error}
        empty={EMPTY_ANSWERS}
        render={(answers) => answers.map((answer) => <AnswerCard key={answer._id} {...answer} />)}
      />
      <Pagination page={page} isNext={isNext || false} containerClasses="mt-10" />
    </div>
  );
};

export default AllAnswers;
