import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Button } from "./components/ui/button";

function App() {
  const lessons = useQuery(api.queries.lessons.getLessons);
  return (
    <>
      {lessons?.map((lesson) => (
        <div key={lesson._id}>{lesson.title}</div>
      ))}
      <Button>Click me</Button>
    </>
  );
}

export default App;
