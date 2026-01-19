import { auth } from "@/auth";

const Home = async () => {
  const session = await auth();
  console.log(session);
  return <div className="min-h-screen w-full"></div>;
};

export default Home;
