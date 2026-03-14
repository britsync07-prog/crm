import { prisma } from "./db";
import { sendRealEmail } from "./mailer";
import {
  deleteLiveKitRoomSafe,
  getPublicMeetingUrl,
  sendMeetingReminderEmails,
} from "./form-meeting";

export async function processCalendarReminders() {
  const now = new Date();
  const reminderWindow = new Date(now.getTime() + 30 * 60000);

  try {
    const endedMeetings = await prisma.meeting.findMany({
      where: {
        status: "ACTIVE",
        endTime: { lt: now },
      },
      select: { id: true, meetingId: true },
    });

    if (endedMeetings.length > 0) {
      await prisma.meeting.updateMany({
        where: { id: { in: endedMeetings.map((m) => m.id) } },
        data: { status: "ENDED" },
      });

      await Promise.all(endedMeetings.map((m) => deleteLiveKitRoomSafe(m.meetingId)));
    }

    const upcomingEvents = await prisma.calendarEvent.findMany({
      where: {
        reminderSent: false,
        start: {
          gte: now,
          lte: reminderWindow,
        },
      },
      include: {
        user: {
          include: {
            calendarSettings: true,
          },
        },
      },
    });

    for (const event of upcomingEvents) {
      const settings = event.user.calendarSettings;

      try {
        if (event.source === "FORM_MEETING" && event.meetingId) {
          const meeting = await prisma.meeting.findUnique({
            where: { id: event.meetingId },
            include: { host: { select: { id: true, email: true } } },
          });

          if (meeting && meeting.status === "ACTIVE" && meeting.submitterEmail) {
            const meetingUrl = getPublicMeetingUrl(meeting.meetingId);
            await sendMeetingReminderEmails({
              creatorUserId: meeting.host.id,
              creatorEmail: meeting.host.email,
              submitterEmail: meeting.submitterEmail,
              meetingTitle: meeting.title,
              meetingUrl,
              startTime: meeting.startTime,
              endTime: meeting.endTime,
            });

            await prisma.calendarEvent.update({
              where: { id: event.id },
              data: { reminderSent: true },
            });
            continue;
          }
        }

        if (!settings?.reminderAccountId) {
          continue;
        }

        await sendRealEmail({
          emailAccountId: settings.reminderAccountId,
          to: event.user.email,
          subject: `Reminder: ${event.title}`,
          body: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #4f46e5; margin-top: 0;">Task Reminder</h2>
              <p>You have an upcoming task in your calendar:</p>
              <div style="background: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #4f46e5;">
                <strong style="display: block; font-size: 18px;">${event.title}</strong>
                <p style="color: #6b7280; font-size: 14px; margin: 10px 0;">
                  Start: ${event.start.toLocaleString()} <br/>
                  End: ${event.end.toLocaleString()}
                </p>
                <p style="margin-bottom: 0;">${event.description || "No description provided."}</p>
              </div>
              <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
 This is an automated notification from your BritCRM Calendar.
              </p>
            </div>
          `,
        });

        await prisma.calendarEvent.update({
          where: { id: event.id },
          data: { reminderSent: true },
        });
      } catch (err) {
        console.error(`[ReminderWorker] Failed reminder for event ${event.id}:`, err);
      }
    }
  } catch (err) {
    console.error("[ReminderWorker] Error processing reminders:", err);
  }
}
