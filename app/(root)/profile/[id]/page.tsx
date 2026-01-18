const ProfilePage = async ({ params }: Promise<{ params: string }>) => {
  const { id } = await params;
  console.log(id);
  return <div>ProfilePage</div>;
};

export default ProfilePage;
