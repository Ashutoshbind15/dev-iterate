import { Excalidraw } from "@excalidraw/excalidraw";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import "@excalidraw/excalidraw/index.css";
import type {
  BinaryFiles,
  AppState,
  ExcalidrawInitialDataState,
} from "@excalidraw/excalidraw/types";

const DiagramsEditor = ({
  initialData,
  onChange,
}: {
  initialData: ExcalidrawInitialDataState;
  onChange: (
    elements: readonly ExcalidrawElement[],
    appState: AppState,
    files: BinaryFiles
  ) => void;
}) => {
  return (
    <div className="h-screen w-[80vw]">
      <Excalidraw initialData={initialData} onChange={onChange} />
    </div>
  );
};

export default DiagramsEditor;
