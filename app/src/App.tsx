import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

function App() {
  const lessons = useQuery(api.queries.lessons.getLessons);
  return (
    <>
      {lessons?.map((lesson) => (
        <div key={lesson._id}>{lesson.title}</div>
      ))}
    </>
  );
}

export default App;
