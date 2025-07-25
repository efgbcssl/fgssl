export type Appointment = {
    id: string; // or xata_id if using Xata's default ID field
    fullName: string;
    phoneNumber: string;
    email: string;
    preferredDate: string;
    medium: 'in-person' | 'online';
    status: 'pending' | 'completed' | 'cancelled' | 'confirmed'; // Added 'confirmed' status
    remark?: string;
    createdAt: string;
    updatedAt: string;

    // Reminder system fields
    reminderSent?: boolean;
    lastReminderSentAt?: string; // ISO date string

    // Timezone information (optional)
    timezone?: string;

    // Links for email reminders
    meetingLink?: string; // For online appointments
    rescheduleToken?: string; // For secure rescheduling
    cancelToken?: string; // For secure cancellation

    // Email tracking
    emailOpened?: boolean;
    emailOpenedAt?: string; // ISO date string
};