import {
  useEditor,
  EditorContent,
  ReactNodeViewRenderer,
  type Editor,
  useEditorState,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { all, createLowlight } from "lowlight";
import "@catppuccin/highlightjs/css/catppuccin-mocha.css";
import CodeBlockComponent from "./code-block";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import DragHandle from "@tiptap/extension-drag-handle-react";
import {
  Bold,
  Italic,
  Strikethrough,
  Code as CodeIcon,
  CodeSquare,
  Pilcrow,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo2,
  Redo2,
  GripHorizontal,
} from "lucide-react";
import { useImperativeHandle, forwardRef, useEffect } from "react";

const lowlight = createLowlight(all);

// Extended code block with React node view
const ExtendedCodeBlock = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockComponent);
  },
}).configure({
  lowlight,
  tabSize: 2,
  enableTabIndentation: true,
});

export type RichTextEditorRef = {
  getJSON: () => object | null;
  getHTML: () => string | null;
};

type RichTextEditorProps = {
  content?: string; // JSON stringified content or empty for default
  isEditable?: boolean;
  className?: string;
  minHeight?: string;
  maxHeight?: string;
  showToolbar?: boolean;
};

const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  (
    {
      content,
      isEditable = true,
      className = "",
      minHeight = "400px",
      maxHeight = "600px",
      showToolbar = true,
    },
    ref
  ) => {
    const initialContent = content
      ? JSON.parse(content)
      : "<p>Start writing your content here...</p>";

    const editor = useEditor({
      extensions: [StarterKit, ExtendedCodeBlock],
      content: initialContent,
      editable: isEditable,
      editorProps: {
        attributes: {
          class: `prose prose-base max-w-none focus:outline-none p-4`,
        },
      },
    });

    // Update content when prop changes
    useEffect(() => {
      if (editor && content) {
        const newContent = JSON.parse(content);
        if (JSON.stringify(editor.getJSON()) !== JSON.stringify(newContent)) {
          editor.commands.setContent(newContent);
        }
      }
    }, [content, editor]);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      getJSON: () => (editor ? editor.getJSON() : null),
      getHTML: () => (editor ? editor.getHTML() : null),
    }));

    return (
      <div
        className={`rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden ${className}`}
      >
        {isEditable && (
          <DragHandle
            editor={editor}
            computePositionConfig={{ placement: "left", strategy: "fixed" }}
          >
            <GripHorizontal className="h-4 w-4 text-slate-400" />
          </DragHandle>
        )}
        {showToolbar && isEditable && <EditorMenu editor={editor} />}
        <EditorContent
          editor={editor}
          style={{ minHeight, maxHeight }}
          className="overflow-y-auto"
        />
      </div>
    );
  }
);

RichTextEditor.displayName = "RichTextEditor";

const MENU_STATE_FALLBACK = {
  isBold: false,
  canBold: false,
  isItalic: false,
  canItalic: false,
  isStrike: false,
  canStrike: false,
  isCode: false,
  canCode: false,
  isParagraph: false,
  isHeading1: false,
  isHeading2: false,
  isHeading3: false,
  isBulletList: false,
  isOrderedList: false,
  isCodeBlock: false,
  isBlockquote: false,
  canUndo: false,
  canRedo: false,
};

const EditorMenu = ({ editor }: { editor: Editor | null }) => {
  const editorState = useEditorState({
    editor,
    selector: (ctx) => {
      const instance = ctx.editor;
      if (!instance) return { ...MENU_STATE_FALLBACK };
      return {
        isBold: instance.isActive("bold") ?? false,
        canBold: instance.can().chain().toggleBold().run() ?? false,
        isItalic: instance.isActive("italic") ?? false,
        canItalic: instance.can().chain().toggleItalic().run() ?? false,
        isStrike: instance.isActive("strike") ?? false,
        canStrike: instance.can().chain().toggleStrike().run() ?? false,
        isCode: instance.isActive("code") ?? false,
        canCode: instance.can().chain().toggleCode().run() ?? false,
        isParagraph: instance.isActive("paragraph") ?? false,
        isHeading1: instance.isActive("heading", { level: 1 }) ?? false,
        isHeading2: instance.isActive("heading", { level: 2 }) ?? false,
        isHeading3: instance.isActive("heading", { level: 3 }) ?? false,
        isBulletList: instance.isActive("bulletList") ?? false,
        isOrderedList: instance.isActive("orderedList") ?? false,
        isCodeBlock: instance.isActive("codeBlock") ?? false,
        isBlockquote: instance.isActive("blockquote") ?? false,
        canUndo: instance.can().chain().undo().run() ?? false,
        canRedo: instance.can().chain().redo().run() ?? false,
      };
    },
  });

  const state = editorState ?? MENU_STATE_FALLBACK;
  if (!editor) return null;

  const formattingValues = [
    ...(state.isBold ? ["bold"] : []),
    ...(state.isItalic ? ["italic"] : []),
    ...(state.isStrike ? ["strike"] : []),
    ...(state.isCode ? ["code"] : []),
  ];

  const blockValues = [
    ...(state.isParagraph ? ["paragraph"] : []),
    ...(state.isHeading1 ? ["heading-1"] : []),
    ...(state.isHeading2 ? ["heading-2"] : []),
    ...(state.isHeading3 ? ["heading-3"] : []),
  ];

  const structureValues = [
    ...(state.isBulletList ? ["bullet-list"] : []),
    ...(state.isOrderedList ? ["ordered-list"] : []),
    ...(state.isCodeBlock ? ["code-block"] : []),
    ...(state.isBlockquote ? ["blockquote"] : []),
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 border-b border-border/50">
      <ToggleGroup
        type="multiple"
        variant="outline"
        size="sm"
        value={formattingValues}
      >
        <ToggleGroupItem
          value="bold"
          disabled={!state.canBold}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="italic"
          disabled={!state.canItalic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="strike"
          disabled={!state.canStrike}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="code"
          disabled={!state.canCode}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <CodeIcon className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>

      <div className="w-px h-6 bg-border" />

      <ToggleGroup
        type="multiple"
        variant="outline"
        size="sm"
        value={blockValues}
      >
        <ToggleGroupItem
          value="paragraph"
          onClick={() => editor.chain().focus().setParagraph().run()}
        >
          <Pilcrow className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="heading-1"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
        >
          <Heading1 className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="heading-2"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="heading-3"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          <Heading3 className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>

      <div className="w-px h-6 bg-border" />

      <ToggleGroup
        type="multiple"
        variant="outline"
        size="sm"
        value={structureValues}
      >
        <ToggleGroupItem
          value="bullet-list"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="ordered-list"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="code-block"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <CodeSquare className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="blockquote"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>

      <div className="w-px h-6 bg-border" />

      <ToggleGroup type="single" variant="outline" size="sm" value="">
        <ToggleGroupItem
          value="hr"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="undo"
          disabled={!state.canUndo}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="redo"
          disabled={!state.canRedo}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};

export default RichTextEditor;
