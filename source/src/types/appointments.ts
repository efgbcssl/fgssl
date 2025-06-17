export type Appointment = {
    fullName: string
    phoneNumber: string
    email: string
    preferredDate: string
    medium: 'in-person' | 'online'
    status: 'pending' | 'completed' | 'cancelled'
    remark?: string
    createdAt: string
    updatedAt: string
}