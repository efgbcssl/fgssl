export type FieldType = 'text' | 'textarea' | 'number' | 'email' | 'select' | 'radio' | 'checkbox'

export type FormFieldOption = {
    id: string
    label: string
}

export type FormField = {
    id: string
    label: string
    type: FieldType
    required: boolean
    options?: FormFieldOption[]
}

export type FormSchema = {
    fields: FormField[]
}