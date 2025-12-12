import { Excalidraw } from "@excalidraw/excalidraw";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import "@excalidraw/excalidraw/index.css";
import type {
  AppState,
  ExcalidrawInitialDataState,
  ExcalidrawImperativeAPI,
} from "@excalidraw/excalidraw/types";
import {
  useCallback,
  useImperativeHandle,
  forwardRef,
  useRef,
  useState,
} from "react";

export type DiagramsEditorRef = {
  getElements: () => readonly ExcalidrawElement[];
  getAppState: () => {
    viewBackgroundColor: string;
    zoom: { value: number };
    scrollX: number;
    scrollY: number;
  };
  setElements: (elements: readonly ExcalidrawElement[]) => void;
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
    const excalidrawApiRef = useRef<ExcalidrawImperativeAPI | null>(null);
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
      getElements: () =>
        excalidrawApiRef.current?.getSceneElements?.() ?? elements,
      getAppState: () => ({
        viewBackgroundColor:
          excalidrawApiRef.current?.getAppState?.().viewBackgroundColor ??
          appState?.viewBackgroundColor ??
          "#ffffff",
        zoom:
          excalidrawApiRef.current?.getAppState?.().zoom ??
          appState?.zoom ??
          { value: 1 },
        scrollX:
          excalidrawApiRef.current?.getAppState?.().scrollX ??
          appState?.scrollX ??
          0,
        scrollY:
          excalidrawApiRef.current?.getAppState?.().scrollY ??
          appState?.scrollY ??
          0,
      }),
      setElements: (elements: readonly ExcalidrawElement[]) => {
        // Keep local state in sync (useful for Save fallback),
        // but also push the new scene into Excalidraw which is uncontrolled after mount.
        setElements(elements);
        excalidrawApiRef.current?.updateScene?.({
          elements,
        });
      },
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
          excalidrawAPI={(api) => {
            excalidrawApiRef.current = api;
          }}
        />
      </div>
    );
  }
);

DiagramsEditor.displayName = "DiagramsEditor";

export default DiagramsEditor;
