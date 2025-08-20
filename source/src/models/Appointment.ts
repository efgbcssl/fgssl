import mongoose, { Schema, Model } from "mongoose";

export type AppointmentStatus = "pending" | "completed" | "cancelled" | "confirmed";
export type AppointmentMedium = "in-person" | "online";

export interface AppointmentDoc extends mongoose.Document {
    fullName: string;
    phoneNumber: string;
    email: string;
    preferredDate: string; // UTC ISO string (start of slot)
    medium: AppointmentMedium;
    status: AppointmentStatus;
    remark?: string;
    createdAt: string;
    updatedAt: string;
    reminderSent?: boolean;
    lastReminderSentAt?: string;
    timezone?: string; // user tz
    meetingLink?: string;
    rescheduleToken?: string;
    cancelToken?: string;
    emailOpened?: boolean;
    emailOpenedAt?: string;
}

const AppointmentSchema = new Schema<AppointmentDoc>(
    {
        fullName: { type: String, required: true },
        phoneNumber: { type: String, required: true },
        email: { type: String, required: true, index: true },
        preferredDate: { type: String, required: true, index: true },
        medium: { type: String, enum: ["in-person", "online"], required: true },
        status: { type: String, enum: ["pending", "completed", "cancelled", "confirmed"], default: "pending", index: true },
        remark: { type: String },
        createdAt: { type: String, required: true },
        updatedAt: { type: String, required: true },
        reminderSent: { type: Boolean, default: false },
        lastReminderSentAt: { type: String },
        timezone: { type: String },
        meetingLink: { type: String },
        rescheduleToken: { type: String },
        cancelToken: { type: String },
        emailOpened: { type: Boolean, default: false },
        emailOpenedAt: { type: String },
    },
    { collection: "appointments" }
);

// prevent recompilation in dev
export const AppointmentModel: Model<AppointmentDoc> =
    mongoose.models.Appointment || mongoose.model<AppointmentDoc>("Appointment", AppointmentSchema);

export default AppointmentModel;