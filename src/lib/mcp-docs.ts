export type McpDocsSection = {
  id: string;
  title: string;
  description: string;
  workflow: string[];
  tools: string[];
};

export const mcpDocsSections: McpDocsSection[] = [
  {
    id: "setup",
    title: "Setup",
    description: "Create a token, add the hosted endpoint to the agent, then read the account snapshot before calling tools.",
    workflow: ["Create a token from Hosted MCP Access.", "Paste the generated config into the MCP client.", "Ask the agent to read the account snapshot before any write."],
    tools: ["resources/read", "tools/list", "tools/call"],
  },
  {
    id: "snapshot",
    title: "Account Snapshot",
    description: "Confirms which CRM user, role, organization, counts, upcoming events, and recent activity the agent is operating on.",
    workflow: ["Read the snapshot at startup.", "Confirm email and role with the user.", "Use returned counts and IDs as context for later work."],
    tools: ["account snapshot resource"],
  },
  {
    id: "mail",
    title: "Mail",
    description: "Manage connected inboxes, read messages, draft replies, send approved email, and perform mailbox actions.",
    workflow: ["List connected accounts.", "Search or read messages.", "Draft first, send only after approval."],
    tools: ["mail.list_accounts", "mail.search_messages", "mail.read_message", "mail.draft_reply", "mail.send_email", "mail.batch_action"],
  },
  {
    id: "leads",
    title: "Leads",
    description: "List, create, update, upload, score, log interactions, and convert user-owned leads.",
    workflow: ["List or upload leads.", "Open a lead before updating it.", "Log every important call, note, or reply."],
    tools: ["leads.list", "leads.get", "leads.create", "leads.update", "leads.upload_csv", "leads.score", "leads.log_interaction", "leads.convert_to_customer"],
  },
  {
    id: "outreach",
    title: "Outreach",
    description: "Preview campaigns, launch approved outreach, send follow-ups, process replies, and inspect campaign analytics.",
    workflow: ["Preview recipients and sender accounts.", "Get explicit approval.", "Launch with confirm true and process replies later."],
    tools: ["outreach.preview_campaign", "outreach.launch_campaign", "outreach.list_campaigns", "outreach.get_campaign", "outreach.send_follow_up", "outreach.process_replies"],
  },
  {
    id: "forms",
    title: "Forms",
    description: "Create forms, generate share messages, inspect submissions, and sync intake data into CRM records.",
    workflow: ["Create the form and fields.", "Share the public form link.", "Review submissions and meeting intake data."],
    tools: ["forms.list", "forms.create", "forms.delete", "forms.get_submissions", "forms.submit_public", "forms.generate_share_message"],
  },
  {
    id: "calendar",
    title: "Calendar",
    description: "Manage availability, check free slots, create events, book client meetings, and cancel events safely.",
    workflow: ["Read settings.", "Check availability before booking.", "Use confirm true only after approval for client meetings."],
    tools: ["calendar.get_settings", "calendar.update_settings", "calendar.list_events", "calendar.check_availability", "calendar.create_event", "calendar.book_client_meeting", "calendar.cancel_event"],
  },
  {
    id: "billing",
    title: "Billing",
    description: "Manage BritLedger clients, invoices, quotations, payments, balances, and invoice email sending.",
    workflow: ["List or create a client.", "Create invoice or quote with line items.", "Use returned balance due and record payments later."],
    tools: ["billing.list_clients", "billing.create_client", "billing.list_invoices", "billing.create_invoice", "billing.update_invoice", "billing.record_payment", "billing.create_quotation", "billing.list_quotations", "billing.convert_quote_to_invoice", "billing.send_invoice"],
  },
  {
    id: "admin",
    title: "Admin",
    description: "Manage pricing plans, discount events, trials, users, system email profiles, and operations snapshots. Admin tools fail unless the token belongs to an ADMIN user.",
    workflow: ["Preview admin changes with confirm false.", "Apply only after approval.", "Audit operations and activity after changes."],
    tools: ["admin.pricing.list_plans", "admin.pricing.upsert_plan", "admin.pricing.upsert_discount_event", "admin.users.search", "admin.users.update", "admin.system_email.update_profile", "admin.operations.snapshot"],
  },
];
