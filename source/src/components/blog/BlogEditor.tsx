'use client'

//import { useFormState } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import StarterKit from '@tiptap/starter-kit';
import { useEditor, EditorContent } from '@tiptap/react';
import Image from '@tiptap/extension-image'
import { Toolbar } from './Toolbar' // Custom toolbar component

interface BlogEditorProps {
    action: (formData: FormData) => Promise<void>
    defaultValues: {
        title: string
        content: string
        excerpt: string
        status: string
        publishDate: string
        categories: string[]
        featuredImage: string
        metaTitle: string
        metaDescription: string
    }
}

export function BlogEditor({ action, defaultValues }: BlogEditorProps) {
    const [content, setContent] = useState(defaultValues.content)
    const [date, setDate] = useState<Date | undefined>(
        defaultValues.publishDate ? new Date(defaultValues.publishDate) : new Date()
    )
    const [categories, setCategories] = useState<string[]>(defaultValues.categories)
    const [newCategory, setNewCategory] = useState('')

    const editor = useEditor({
        extensions: [
            StarterKit,
            Image.configure({
                inline: true,
                allowBase64: true,
            })
        ],
        content: content,
        onUpdate: ({ editor }) => {
            setContent(editor.getHTML())
        }
    });

    const handleAddCategory = () => {
        if (newCategory.trim() && !categories.includes(newCategory.trim())) {
            setCategories([...categories, newCategory.trim()])
            setNewCategory('')
        }
    }

    const handleRemoveCategory = (categoryToRemove: string) => {
        setCategories(categories.filter(category => category !== categoryToRemove))
    }

    const addImage = () => {
        const url = window.prompt('Enter the URL of the image: ')
        if (url && editor) {
            editor?.chain().focus().setImage({ src: url }).run()
        }
    }

    if (!editor) {
        return <div>Loading editor...</div>
    }

    return (
        <form action={action} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            name="title"
                            defaultValue={defaultValues.title}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="excerpt">Excerpt</Label>
                        <Textarea
                            id="excerpt"
                            name="excerpt"
                            defaultValue={defaultValues.excerpt}
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Content</Label>
                        <div className='rounded-lg border bg-white p-2'>
                            <Toolbar editor={editor} addImage={addImage} />
                            <EditorContent
                                editor={editor}
                                className='min-h-[300px] p-2'
                            />
                        </div>
                        <input type="hidden" name="content" value={content} />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select name="status" defaultValue={defaultValues.status}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="published">Published</SelectItem>
                                <SelectItem value="scheduled">Scheduled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Publish Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPPpp") : <span>Now</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                />
                                <div className='p-3 border-t'>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => (setDate(new Date))}
                                        className='w-full'
                                    >
                                        Set to Current Time
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>
                        <input type="hidden" name="publishDate" value={date?.toISOString() ?? new Date().toString()} />
                    </div>

                    <div className="space-y-2">
                        <Label>Categories</Label>
                        <div className="flex gap-2">
                            <Input
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                placeholder="Add category"
                            />
                            <Button type="button" onClick={handleAddCategory}>
                                Add
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {categories.map((category) => (
                                <div
                                    key={category}
                                    className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full text-sm"
                                >
                                    <span>{category}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveCategory(category)}
                                        className="text-gray-500 hover:text-red-500"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                        <input type="hidden" name="categories" value={JSON.stringify(categories)} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="featuredImage">Featured Image URL</Label>
                        <Input
                            id="featuredImage"
                            name="featuredImage"
                            defaultValue={defaultValues.featuredImage}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="metaTitle">Meta Title (SEO)</Label>
                        <Input
                            id="metaTitle"
                            name="metaTitle"
                            defaultValue={defaultValues.metaTitle}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="metaDescription">Meta Description (SEO)</Label>
                        <Textarea
                            id="metaDescription"
                            name="metaDescription"
                            defaultValue={defaultValues.metaDescription}
                            rows={3}
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4">
                <Button type="button" variant="outline">
                    Save Draft
                </Button>
                <Button type="submit">Publish</Button>
            </div>
        </form>
    )
}