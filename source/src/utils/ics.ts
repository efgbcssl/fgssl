import { formatInTimeZone } from "date-fns-tz";
import crypto from "crypto";
import { PASTOR_TZ } from "./availability";

export type IcsArgs = {
  uid?: string;
  title: string;
  description?: string;
  location?: string;
  startUtcISO: string; // slot start UTC
  durationMinutes?: number; // default 30
  organizerEmail?: string;
  attendeeEmail?: string;
  status?: "CONFIRMED" | "CANCELLED" | "TENTATIVE";
  method?: "REQUEST" | "CANCEL" | "PUBLISH";
};

export function buildICS({
  uid,
  title,
  description = "",
  location = "",
  startUtcISO,
  durationMinutes = 30,
  organizerEmail,
  attendeeEmail,
  status = "CONFIRMED",
  method = "REQUEST", // default REQUEST → works for invites
}: IcsArgs): string {
  const dtstartUTC = startUtcISO
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
  const startDate = new Date(startUtcISO);

  const endDate = new Date(
    startDate.getTime() + durationMinutes * 60 * 1000
  );
  const dtendUTC = endDate
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");

  const nowUTC = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");

  const _uid = uid || crypto.randomUUID();

  // Human-friendly for description
  const humanNY = formatInTimeZone(
    startDate,
    PASTOR_TZ,
    "EEE, MMM d, yyyy h:mm a zzz"
  );

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    "PRODID:-//EFGBC SSL//Appointments//EN",
    `METHOD:${method}`,
    "BEGIN:VEVENT",
    `UID:${_uid}`,
    `DTSTAMP:${nowUTC}`,
    `DTSTART:${dtstartUTC}`,
    `DTEND:${dtendUTC}`,
    `SUMMARY:${escapeIcs(title)}`,
    `STATUS:${status}`,
    description
      ? `DESCRIPTION:${escapeIcs(description)}\\nPastor (NY): ${escapeIcs(
          humanNY
        )}`
      : `DESCRIPTION:Pastor (NY): ${escapeIcs(humanNY)}`,
    location ? `LOCATION:${escapeIcs(location)}` : undefined,
    organizerEmail ? `ORGANIZER;CN=Pastor:mailto:${organizerEmail}` : undefined,
    attendeeEmail
      ? `ATTENDEE;RSVP=TRUE;CN=Attendee:mailto:${attendeeEmail}`
      : undefined,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

function escapeIcs(text: string) {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export function icsResponse(
  ics: string,
  filename = "appointment.ics"
): Response {
  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename=${filename}`,
      "Cache-Control": "no-store",
    },
  });
}

export function generateICS(args: IcsArgs): string {
  return buildICS(args);
}
s