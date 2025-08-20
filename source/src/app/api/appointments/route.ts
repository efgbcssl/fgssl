import { NextRequest } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Appointment from "@/models/Appointment";
import { buildICS } from "@/utils/ics";
import { sendMail } from "@/lib/";

/**
 * GET /api/appointments
 * Query params:
 *  - page (default 1)
 *  - pageSize (default 20, max 100)
 *  - status (optional)
 *  - q (search by name/email/phone)
 */
export async function GET(req: NextRequest) {
    try {
        await connectMongoDB();
        const { searchParams } = new URL(req.url);

        const page = Math.max(1, Number(searchParams.get("page") || 1));
        const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 20)));
        const status = searchParams.get("status");
        const q = searchParams.get("q");

        const where: Record<string, unknown> = {};
        if (status) where["status"] = status;
        if (q) {
            where["$or"] = [
                { fullName: { $regex: q, $options: "i" } },
                { email: { $regex: q, $options: "i" } },
                { phoneNumber: { $regex: q, $options: "i" } },
            ];
        }

        const total = await Appointment.countDocuments(where);
        const items = await Appointment.find(where)
            .sort({ preferredDate: 1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .lean();

        return Response.json({ items, total, page, pageSize }, { status: 200 });
    } catch (err) {
        console.error("[GET] /api/appointments ->", err);
        return Response.json({ message: "Internal server error" }, { status: 500 });
    }
}

/**
 * POST /api/appointments
 * Body JSON (required):
 *  - fullName: string
 *  - phoneNumber: string
 *  - email: string
 *  - preferredDate: string (UTC ISO for the slot start; server expects exact 30-min slot instants)
 *  - medium: 'in-person' | 'online'
 *  - status?: 'pending' | 'confirmed' | 'completed' | 'cancelled' (default 'pending')
 *  - remark?: string
 *  - userTimeZone?: string (IANA tz of the requester, optional)
 */
export async function POST(req: NextRequest) {
    try {
        await connectMongoDB();
        const body = await req.json();

        const {
            fullName,
            phoneNumber,
            email,
            preferredDate, // UTC ISO (slot start)
            medium,
            status = "pending",
            remark,
            userTimeZone,
            meetingLink, // optional, useful for online
        } = body || {};

        if (!fullName || !phoneNumber || !email || !preferredDate || !medium) {
            return Response.json({ message: "Missing required fields." }, { status: 400 });
        }

        // Validate date
        const slotStart = new Date(preferredDate);
        if (isNaN(slotStart.getTime())) {
            return Response.json({ message: "Invalid preferredDate (must be ISO UTC)." }, { status: 400 });
        }

        // Normalize to exact ISO string (millisecond precision removed if needed)
        const slotIso = slotStart.toISOString();

        // Conflict: exact slot (30 min) occupied & not cancelled
        const existing = await Appointment.findOne({
            status: { $ne: "cancelled" },
            preferredDate: slotIso,
        }).lean();

        if (existing) {
            return Response.json({ message: "Selected slot is already booked." }, { status: 409 });
        }

        const nowIso = new Date().toISOString();

        const created = await Appointment.create({
            fullName,
            phoneNumber,
            email,
            preferredDate: slotIso,
            medium,
            status,
            remark,
            timezone: userTimeZone,
            meetingLink,
            createdAt: nowIso,
            updatedAt: nowIso,
        });

        // Optional email notifications (ICS makes the time appear correctly for both parties)
        try {
            const ics = buildICS({
                title: `Appointment with Pastor`,
                description: remark || "",
                location: medium === "in-person" ? "Silver Spring, MD" : meetingLink || "Online",
                startUtcISO: created.preferredDate,
                organizerEmail: process.env.MAIL_FROM,
                attendeeEmail: email,
            });

            // Send to requester
            await sendMail({
                to: email,
                subject: `Your appointment request`,
                html: `<p>Hi ${fullName},</p><p>Thanks for your request. We'll confirm soon.</p>`,
                icalEvent: { filename: "appointment.ics", content: ics },
            });

            // Send to admin/pastor
            const adminTo = process.env.MAIL_FROM;
            if (adminTo) {
                await sendMail({
                    to: adminTo,
                    subject: `New appointment request from ${fullName}`,
                    html: `<p>New request for <strong>${new Date(created.preferredDate).toUTCString()}</strong> (UTC).</p>`,
                    icalEvent: { filename: "appointment.ics", content: ics },
                });
            }
        } catch (mailErr) {
            // Don’t fail the booking if email fails
            console.warn("[POST] /api/appointments mail warning ->", mailErr);
        }

        return Response.json({ item: created }, { status: 201 });
    } catch (err) {
        console.error("[POST] /api/appointments ->", err);
        return Response.json({ message: "Internal server error" }, { status: 500 });
    }
}