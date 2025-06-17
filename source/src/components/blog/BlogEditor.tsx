/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import ImageExtension from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { Toolbar } from './Toolbar'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import Upload from 'imagekit-javascript' // or your wrapper OAuth

interface BlogEditorDefaultValues {
    title?: string
    excerpt?: string
    content?: string
    featuredImage?: string
    status?: 'draft' | 'published' | 'scheduled'
    publishDate?: string | Date
    metaTitle?: string
    metaDescription?: string
}

interface BlogEditorProps {
    action: (formData: FormData) => Promise<void>
    defaultValues: BlogEditorDefaultValues
}

const imagekit = new Upload({
    publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || '',
    urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || 'public_PEUl1g79PnvCS5xvi49GqgmcmlM=',
})

export function BlogEditor({ action, defaultValues }: BlogEditorProps) {
    const [featuredImageUrl, setFeaturedImageUrl] = useState(defaultValues.featuredImage || '')
    const [content, setContent] = useState(defaultValues.content || '')
    const [date, setDate] = useState<Date>(
        new Date(defaultValues.publishDate ? defaultValues.publishDate : Date.now())
    )

    const editor = useEditor({
        extensions: [
            StarterKit,
            ImageExtension.configure({ inline: true }),
            Placeholder.configure({ placeholder: 'Start writing your story...' }),
        ],
        content: defaultValues.content,
        onUpdate: ({ editor }) => setContent(editor.getHTML()),
    })

    const uploadImage = async (file: File): Promise<string> => {
        // Fetch authentication parameters from your backend
        const authRes = await fetch('/api/imagekit-auth')
        const { signature, token, expire } = await authRes.json()

        const res = await imagekit.upload({
            file,
            fileName: file.name,
            folder: '/blog-images',
            signature,
            token,
            expire,
        })
        return res.url
    }

    const addImageToContent = () => {
        const file = window.prompt('Image URL or choose file? (file input will appear)')
        if (file === 'file') {
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = 'image/*'
            input.onchange = async (e) => {
                const f = (e.target as HTMLInputElement).files?.[0]
                if (f && editor) {
                    const url = await uploadImage(f)
                    editor.chain().focus().setImage({ src: url }).run()
                }
            }
            input.click()
        } else if (file && editor) {
            editor.chain().focus().setImage({ src: file }).run()
        }
    }

    const handleFeaturedUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0]
        if (f) {
            const url = await uploadImage(f)
            setFeaturedImageUrl(url)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const form = new FormData(e.currentTarget as HTMLFormElement)
        form.set('content', content)
        form.set('featuredImage', featuredImageUrl)
        form.set('publishDate', date.toISOString())
        await action(form)
    }

    return (
        <form onSubmit={handleSubmit} className="mx-auto max-w-screen-lg space-y-8 px-4 py-8">
            <div className="grid gap-8 lg:grid-cols-3">
                {/* Left side */}
                <div className="lg:col-span-2 space-y-6">
                    <div>
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" name="title" defaultValue={defaultValues.title} required />
                    </div>

                    <div>
                        <Label htmlFor="excerpt">Excerpt</Label>
                        <Textarea id="excerpt" name="excerpt" defaultValue={defaultValues.excerpt} rows={3} />
                    </div>

                    <div className="border rounded bg-white p-4">
                        <Toolbar editor={editor} onAddImage={addImageToContent} />
                        <EditorContent editor={editor} className="prose min-h-[300px] w-full rounded-md border border-gray-300 p-4 focus:outline-none" />
                        <input type="hidden" name="content" value={content} />
                    </div>
                </div>

                {/* Right side */}
                <div className="space-y-6">
                    <div>
                        <Label htmlFor="featuredImage">Featured Image</Label>
                        {featuredImageUrl ? (
                            <div className="relative h-48 w-full rounded bg-gray-200 overflow-hidden">
                                <img src={featuredImageUrl} className="h-full w-full object-cover" alt="featured" />
                            </div>
                        ) : (
                            <div className="border-dashed border-2 border-gray-300 h-48 rounded flex items-center justify-center text-gray-400">
                                No image selected
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFeaturedUpload}
                            className="mt-2 block w-full"
                        />
                        <input type="hidden" name="featuredImage" value={featuredImageUrl} />
                    </div>

                    <div>
                        <Label htmlFor="status">Status</Label>
                        <select name="status" defaultValue={defaultValues.status} className="block w-full">
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                            <option value="scheduled">Scheduled</option>
                        </select>
                    </div>

                    <div>
                        <Label>Publish Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start font-normal">
                                    {format(date, 'PPPpp')}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent>
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={(d) => d && setDate(d)}
                                />
                            </PopoverContent>
                        </Popover>
                        <input type="hidden" name="publishDate" value={date.toISOString()} />
                    </div>

                    {/* SEO */}
                    <div>
                        <Label htmlFor="metaTitle">Meta Title</Label>
                        <Input id="metaTitle" name="metaTitle" defaultValue={defaultValues.metaTitle} />
                    </div>

                    <div>
                        <Label htmlFor="metaDescription">Meta Description</Label>
                        <Textarea id="metaDescription" name="metaDescription" defaultValue={defaultValues.metaDescription} rows={3} />
                    </div>

                    <Button type="submit" className="w-full">
                        Save & Publish
                    </Button>
                </div>
            </div>
        </form>
    )
}
