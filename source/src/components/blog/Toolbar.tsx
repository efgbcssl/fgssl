'use client'

import { Editor } from '@tiptap/react'
import { cn } from '@/lib/utils'

type ToolbarProps = {
    editor: Editor | null
    addImage: () => void
}

export function Toolbar({ editor, addImage }: ToolbarProps) {
    if (!editor) return null

    return (
        <div className="flex flex-wrap gap-1 border-b p-1">
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={cn(
                    'rounded p-1 hover:bg-gray-100',
                    editor.isActive('bold') ? 'bg-gray-200' : ''
                )}
            >
                <strong>B</strong>
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={cn(
                    'rounded p-1 hover:bg-gray-100',
                    editor.isActive('italic') ? 'bg-gray-200' : ''
                )}
            >
                <em>I</em>
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toogleUnderline().run()}
                className={cn(
                    'rounded p-1 hover:bg-gray-100',
                    editor.isActive('underline') ? 'bg-gray-200' : ''
                )}
            >
                <u>U</u>
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={cn(
                    'rounded p-1 hover:bg-gray-100',
                    editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''
                )}
            >
                H1
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={cn(
                    'rounded p-1 hover:bg-gray-100',
                    editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''
                )}
            >
                H2
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={cn(
                    'rounded p-1 hover:bg-gray-100',
                    editor.isActive('bulletList') ? 'bg-gray-200' : ''
                )}
            >
                • List
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={cn(
                    'rounded p-1 hover:bg-gray-100',
                    editor.isActive('orderedList') ? 'bg-gray-200' : ''
                )}
            >
                1. List
            </button>
            <button
                type="button"
                onClick={addImage}
                className="rounded p-1 hover:bg-gray-100"
            >
                Image
            </button>
        </div>
    )
}