'use client'

import { Editor } from '@tiptap/react'
import { cn } from '@/lib/utils'
import { Undo2, Redo2, Bold, Italic, Underline, List, ListOrdered, Quote, Heading1, Heading2, Image, Link } from 'lucide-react'
import { Underline as U } from '@tiptap/extension-underline'


type ToolbarProps = {
    editor: Editor | null
    onAddImage: () => void
}

export function Toolbar({ editor, onAddImage }: ToolbarProps) {
    if (!editor) return null

    const buttonClass = (active: boolean) =>
        cn('rounded p-2 hover:bg-gray-100 transition', active && 'bg-gray-200')

    return (
        <div className="flex flex-wrap gap-2 border-b px-2 py-2 bg-white sticky top-0 z-10">
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={buttonClass(editor.isActive('bold'))}
                title="Bold"
            >
                <Bold className="w-4 h-4" />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={buttonClass(editor.isActive('italic'))}
                title="Italic"
            >
                <Italic className="w-4 h-4" />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={buttonClass(editor.isActive('underline'))}
                title="Underline"
            >
                <Underline className="w-4 h-4" />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={buttonClass(editor.isActive('heading', { level: 1 }))}
                title="Heading 1"
            >
                <Heading1 className="w-4 h-4" />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={buttonClass(editor.isActive('heading', { level: 2 }))}
                title="Heading 2"
            >
                <Heading2 className="w-4 h-4" />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={buttonClass(editor.isActive('bulletList'))}
                title="Bullet List"
            >
                <List className="w-4 h-4" />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={buttonClass(editor.isActive('orderedList'))}
                title="Numbered List"
            >
                <ListOrdered className="w-4 h-4" />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={buttonClass(editor.isActive('blockquote'))}
                title="Blockquote"
            >
                <Quote className="w-4 h-4" />
            </button>
            <button
                type="button"
                onClick={onAddImage}
                className="rounded p-2 hover:bg-gray-100 transition"
                title="Add Image"
            >
                <Image className="w-4 h-4" />
            </button>
            <button
                type="button"
                onClick={() => {
                    const url = window.prompt('Enter URL')
                    if (url) {
                        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
                    }
                }}
                className={buttonClass(editor.isActive('link'))}
                title="Insert Link"
            >
                <Link className="w-4 h-4" />
            </button>
            <div className="ml-auto flex gap-2">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().undo().run()}
                    className="rounded p-2 hover:bg-gray-100 transition"
                    title="Undo"
                >
                    <Undo2 className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().redo().run()}
                    className="rounded p-2 hover:bg-gray-100 transition"
                    title="Redo"
                >
                    <Redo2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}
