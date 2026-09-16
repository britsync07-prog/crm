export const LEAD_STAGES = {
  NEW: "New",
  CONTACTED: "Contacted",
  INBOUND: "Inbound Client",
  MEETING_BOOKED: "Meeting Booked",
  QUALIFIED: "Qualified",
  CONVERTED: "Converted",
} as const;

export type LeadStage = (typeof LEAD_STAGES)[keyof typeof LEAD_STAGES];
