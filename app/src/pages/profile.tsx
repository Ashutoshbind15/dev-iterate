import { api } from "../../convex/_generated/api";
import { useQuery } from "convex/react";

const ProfilePage = () => {
  const user = useQuery(api.queries.user.currentUser);

  if (!user) {
    return <div className="min-h-screen bg-white p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            Profile
          </h1>
          <p className="text-zinc-500 mt-2">{user?.name || user?.email}</p>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
