import { NextRequest } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Appointment from "@/models/Appointment";
import { buildNySlotsToUTC, toNy24 } from "@/utils/availability";

/**
 * GET /api/appointments/check?date=yyyy-MM-dd
 *
 * Contract:
 * - `date` must be a New York (America/New_York) calendar date (yyyy-MM-dd).
 * - Returns `{ bookedSlots: string[] }` where items are NY 24h strings (e.g., "14:00").
 * - Excludes appointments with status "cancelled".
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const dateParam = searchParams.get("date"); // New York date (yyyy-MM-dd)

        if (!dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
            return Response.json(
                { message: "Missing or invalid 'date' (expected yyyy-MM-dd in New York timezone)." },
                { status: 400 }
            );
        }

        // All availability is defined in the pastor's timezone (America/New_York)
        await connectMongoDB();

        // Generate all possible slot *UTC instants* for the given NY date
        const slotUtcInstants = buildNySlotsToUTC(dateParam);

        // If the day has no windows (e.g., not Mon/Wed/Sat), return empty bookedSlots
        if (!slotUtcInstants.length) {
            return Response.json({ bookedSlots: [] }, { status: 200 });
        }

        // Compute the UTC window to query existing bookings (first slot start to last slot end)
        const startUTC = slotUtcInstants[0];
        const endUTC = new Date(slotUtcInstants[slotUtcInstants.length - 1].getTime() + 30 * 60 * 1000);

        // Pull all non-cancelled appointments that fall inside this UTC window
        const appts = await Appointment.find({
            status: { $ne: "cancelled" },
            preferredDate: { $gte: startUTC.toISOString(), $lt: endUTC.toISOString() },
        }).lean();

        // Map existing bookings to New York HH:mm keys
        const booked = appts.map((a) => toNy24(new Date(a.preferredDate)));

        return Response.json({ bookedSlots: booked }, { status: 200 });
    } catch (err) {
        console.error("[GET] /api/appointments/check ->", err);
        return Response.json({ message: "Internal server error" }, { status: 500 });
    }
}