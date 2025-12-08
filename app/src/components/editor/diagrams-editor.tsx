import { Excalidraw } from "@excalidraw/excalidraw";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import "@excalidraw/excalidraw/index.css";
import type {
  AppState,
  ExcalidrawInitialDataState,
} from "@excalidraw/excalidraw/types";
import { useCallback, useImperativeHandle, forwardRef, useState } from "react";

export type DiagramsEditorRef = {
  getElements: () => readonly ExcalidrawElement[];
  getAppState: () => {
    viewBackgroundColor: string;
    zoom: { value: number };
    scrollX: number;
    scrollY: number;
  };
};

type DiagramsEditorProps = {
  initialData?: ExcalidrawInitialDataState;
  isEditable?: boolean;
  className?: string;
  height?: string;
};

const DiagramsEditor = forwardRef<DiagramsEditorRef, DiagramsEditorProps>(
  (
    {
      initialData = {
        elements: [],
        appState: { viewBackgroundColor: "#ffffff" },
      },
      isEditable = true,
      className = "",
      height = "calc(100vh - 280px)",
    },
    ref
  ) => {
    const [elements, setElements] = useState<readonly ExcalidrawElement[]>(
      initialData.elements ?? []
    );
    const [appState, setAppState] = useState<AppState | null>(null);

    const handleChange = useCallback(
      (newElements: readonly ExcalidrawElement[], newAppState: AppState) => {
        setElements(newElements);
        setAppState(newAppState);
      },
      []
    );

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      getElements: () => elements,
      getAppState: () => ({
        viewBackgroundColor: appState?.viewBackgroundColor ?? "#ffffff",
        zoom: appState?.zoom ?? { value: 1 },
        scrollX: appState?.scrollX ?? 0,
        scrollY: appState?.scrollY ?? 0,
      }),
    }));

    return (
      <div
        className={`rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden ${className}`}
        style={{ height, minHeight: "500px" }}
      >
        <Excalidraw
          initialData={initialData}
          onChange={isEditable ? handleChange : undefined}
          viewModeEnabled={!isEditable}
        />
      </div>
    );
  }
);

DiagramsEditor.displayName = "DiagramsEditor";

export default DiagramsEditor;
