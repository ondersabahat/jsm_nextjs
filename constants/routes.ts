const ROUTES = {
  HOME: "/",
  SIGN_IN: "/sign-in",
  SIGN_UP: "/sign-up",
  ASK_QUESTION: "/ask-question",
  TAGS: "/tags",
  PROFILE: (id: string) => `/profile/${id}`,
  QUESTIONS: (id: string) => `/questions/${id}`,
  TAG: (id: string) => `/tags/${id}`,
  SIGN_IN_WITH_OAUTH: `signin-with-oauth`,
  COLLECTION: "/collection",
  JOBS: "/jobs",
  COMMUNITY: "/community",
  EDIT: (id: string) => `/questions/${id}/edit`,
};

export default ROUTES;
