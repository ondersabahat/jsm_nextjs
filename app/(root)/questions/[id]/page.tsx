const QuestionDetails = async ({ params }: RouteParams) => {
  const { id } = await params;
  return <div>The question details page for {id}</div>;
};

export default QuestionDetails;
