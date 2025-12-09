import { api } from "../../convex/_generated/api";
import { useQuery } from "convex/react";

const ProfilePage = () => {
  const user = useQuery(api.queries.user.currentUser);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Profile</h1>
      <p>{user?.name}</p>
    </div>
  );
};

export default ProfilePage;
