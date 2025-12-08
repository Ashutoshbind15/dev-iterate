import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import RichTextEditor from "./components/editor/rich-text-editor";
import DiagramsEditor from "./components/editor/diagrams-editor";

function App() {
  const lessons = useQuery(api.queries.lessons.getLessons);
  return (
    <>
      {lessons?.map((lesson) => (
        <div key={lesson._id}>{lesson.title}</div>
      ))}

      <RichTextEditor content={""} isEditable={true} />
      <DiagramsEditor
        initialData={{
          elements: [],
          appState: {
            viewBackgroundColor: "white",
          },
        }}
        onChange={(elements, appState, files) => {
          console.log("elements", elements);
          console.log("appState", appState);
          console.log("files", files);
        }}
      />
    </>
  );
}

export default App;
