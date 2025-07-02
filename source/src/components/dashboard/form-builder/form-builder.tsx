import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { FieldType, FormField, FormSchema } from './types'

export const FormBuilder = ({
    schema,
    onChange
}: {
    schema: FormSchema,
    onChange: (schema: FormSchema) => void
}) => {
    const [fields, setFields] = useState<FormField[]>(schema.fields || [])

    const addField = () => {
        const newFields = [...fields, {
            id: `field-${Date.now()}`,
            label: 'New Field',
            type: 'text',
            required: false,
            options: []
        }]
        setFields(newFields)
        onChange({ fields: newFields })
    }

    const updateField = (id: string, updates: Partial<FormField>) => {
        const newFields = fields.map(field =>
            field.id === id ? { ...field, ...updates } : field
        )
        setFields(newFields)
        onChange({ fields: newFields })
    }

    const removeField = (id: string) => {
        const newFields = fields.filter(field => field.id !== id)
        setFields(newFields)
        onChange({ fields: newFields })
    }

    const moveField = (index: number, direction: 'up' | 'down') => {
        if (
            (direction === 'up' && index === 0) ||
            (direction === 'down' && index === fields.length - 1)
        ) return

        const newFields = [...fields]
        const newIndex = direction === 'up' ? index - 1 : index + 1
            ;[newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]]
        setFields(newFields)
        onChange({ fields: newFields })
    }

    const addOption = (fieldId: string) => {
        const newFields = fields.map(field => {
            if (field.id === fieldId) {
                return {
                    ...field,
                    options: [...(field.options || []), { id: `opt-${Date.now()}`, label: '' }]
                }
            }
            return field
        })
        setFields(newFields)
        onChange({ fields: newFields })
    }

    const updateOption = (fieldId: string, optionId: string, label: string) => {
        const newFields = fields.map(field => {
            if (field.id === fieldId) {
                return {
                    ...field,
                    options: (field.options || []).map(opt =>
                        opt.id === optionId ? { ...opt, label } : opt
                    )
                }
            }
            return field
        })
        setFields(newFields)
        onChange({ fields: newFields })
    }

    const removeOption = (fieldId: string, optionId: string) => {
        const newFields = fields.map(field => {
            if (field.id === fieldId) {
                return {
                    ...field,
                    options: (field.options || []).filter(opt => opt.id !== optionId)
                }
            }
            return field
        })
        setFields(newFields)
        onChange({ fields: newFields })
    }

    return (
        <div className="space-y-4">
            {fields.map((field, index) => (
                <div key={field.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => moveField(index, 'up')}
                                disabled={index === 0}
                                className="disabled:opacity-30"
                            >
                                <ChevronUp className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => moveField(index, 'down')}
                                disabled={index === fields.length - 1}
                                className="disabled:opacity-30"
                            >
                                <ChevronDown className="h-4 w-4" />
                            </button>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeField(field.id)}
                        >
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Field Label</label>
                            <Input
                                value={field.label}
                                onChange={(e) => updateField(field.id, { label: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Field Type</label>
                            <Select
                                value={field.type}
                                onValueChange={(value) => updateField(field.id, {
                                    type: value as FieldType,
                                    options: value === 'select' || value === 'radio' || value === 'checkbox'
                                        ? field.options || []
                                        : undefined
                                })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select field type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="text">Text</SelectItem>
                                    <SelectItem value="textarea">Text Area</SelectItem>
                                    <SelectItem value="number">Number</SelectItem>
                                    <SelectItem value="email">Email</SelectItem>
                                    <SelectItem value="select">Dropdown</SelectItem>
                                    <SelectItem value="radio">Radio Buttons</SelectItem>
                                    <SelectItem value="checkbox">Checkbox</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id={`required-${field.id}`}
                            checked={field.required}
                            onChange={(e) => updateField(field.id, { required: e.target.checked })}
                        />
                        <label htmlFor={`required-${field.id}`} className="text-sm font-medium">
                            Required Field
                        </label>
                    </div>

                    {(field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') && (
                        <div className="space-y-2 pt-2">
                            <label className="block text-sm font-medium">Options</label>
                            <div className="space-y-2">
                                {field.options?.map((option) => (
                                    <div key={option.id} className="flex items-center space-x-2">
                                        <Input
                                            value={option.label}
                                            onChange={(e) => updateOption(field.id, option.id, e.target.value)}
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeOption(field.id, option.id)}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => addOption(field.id)}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Option
                            </Button>
                        </div>
                    )}
                </div>
            ))}

            <Button
                variant="outline"
                onClick={addField}
            >
                <Plus className="mr-2 h-4 w-4" />
                Add Field
            </Button>
        </div>
    )
}