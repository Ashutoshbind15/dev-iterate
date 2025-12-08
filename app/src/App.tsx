import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import RichTextEditor from "./components/editor/rich-text-editor";

function App() {
  const lessons = useQuery(api.queries.lessons.getLessons);
  return (
    <>
      {lessons?.map((lesson) => (
        <div key={lesson._id}>{lesson.title}</div>
      ))}

      <RichTextEditor content={""} isEditable={true} />
    </>
  );
}

export default App;
