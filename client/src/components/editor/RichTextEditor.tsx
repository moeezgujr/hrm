import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Heading from '@tiptap/extension-heading';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Undo,
  Redo,
} from 'lucide-react';
import { Card } from '@/components/ui/card';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
}

const COLORS = [
  { name: 'Black', value: '#000000' },
  { name: 'Red', value: '#DC2626' },
  { name: 'Orange', value: '#EA580C' },
  { name: 'Yellow', value: '#CA8A04' },
  { name: 'Green', value: '#16A34A' },
  { name: 'Blue', value: '#2563EB' },
  { name: 'Purple', value: '#9333EA' },
  { name: 'Pink', value: '#DB2777' },
];

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Start writing...',
  editable = true,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Heading.configure({
        levels: [1, 2, 3],
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4',
      },
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {editable && (
        <Card className="border-0 border-b rounded-none">
          <div className="flex flex-wrap gap-1 p-2 bg-gray-50">
            {/* Text Formatting */}
            <div className="flex gap-1 border-r pr-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={editor.isActive('bold') ? 'bg-gray-200' : ''}
                data-testid="button-bold"
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={editor.isActive('italic') ? 'bg-gray-200' : ''}
                data-testid="button-italic"
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={editor.isActive('underline') ? 'bg-gray-200' : ''}
                data-testid="button-underline"
              >
                <UnderlineIcon className="h-4 w-4" />
              </Button>
            </div>

            {/* Headings */}
            <div className="flex gap-1 border-r pr-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''}
                data-testid="button-h1"
              >
                <Heading1 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}
                data-testid="button-h2"
              >
                <Heading2 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={editor.isActive('heading', { level: 3 }) ? 'bg-gray-200' : ''}
                data-testid="button-h3"
              >
                <Heading3 className="h-4 w-4" />
              </Button>
            </div>

            {/* Lists */}
            <div className="flex gap-1 border-r pr-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={editor.isActive('bulletList') ? 'bg-gray-200' : ''}
                data-testid="button-bulletlist"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={editor.isActive('orderedList') ? 'bg-gray-200' : ''}
                data-testid="button-orderedlist"
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
            </div>

            {/* Alignment */}
            <div className="flex gap-1 border-r pr-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                className={editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : ''}
                data-testid="button-align-left"
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                className={editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : ''}
                data-testid="button-align-center"
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                className={editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : ''}
                data-testid="button-align-right"
              >
                <AlignRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Text Color */}
            <div className="flex gap-1 border-r pr-2">
              <div className="flex items-center gap-1">
                <Palette className="h-4 w-4 text-gray-600 ml-1" />
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => editor.chain().focus().setColor(color.value).run()}
                    className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                    data-testid={`button-color-${color.name.toLowerCase()}`}
                  />
                ))}
              </div>
            </div>

            {/* Undo/Redo */}
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                data-testid="button-undo"
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                data-testid="button-redo"
              >
                <Redo className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      <EditorContent editor={editor} className="bg-white" />
    </div>
  );
}
