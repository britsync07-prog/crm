-- Form scheduling settings
ALTER TABLE "Form" ADD COLUMN "meetingSchedulingEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Form" ADD COLUMN "meetingDurationMin" INTEGER NOT NULL DEFAULT 60;

-- Calendar event lock and meeting linkage
ALTER TABLE "CalendarEvent" ADD COLUMN "isLocked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CalendarEvent" ADD COLUMN "source" TEXT;
ALTER TABLE "CalendarEvent" ADD COLUMN "meetingId" TEXT;
ALTER TABLE "CalendarEvent" ADD COLUMN "externalMeta" TEXT;

-- Meeting metadata for form submissions
ALTER TABLE "Meeting" ADD COLUMN "formId" TEXT;
ALTER TABLE "Meeting" ADD COLUMN "formSubmissionId" TEXT;
ALTER TABLE "Meeting" ADD COLUMN "submitterEmail" TEXT;
ALTER TABLE "Meeting" ADD COLUMN "metadata" TEXT;
