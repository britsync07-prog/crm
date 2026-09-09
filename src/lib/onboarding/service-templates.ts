import { prisma } from "@/lib/db";

export interface DefaultServiceTemplateDef {
  name: string;
  code: string;
  description: string;
  requiredDocuments: string[];
  requiredInformation: {
    internal: Array<{
      key: string;
      label: string;
      type: "currency" | "text" | "date" | "dropdown" | "radio" | "textarea";
      required: boolean;
      defaultValue?: any;
      options?: string[];
      helpText?: string;
    }>;
    client: Array<{
      key: string;
      label: string;
      subtitle?: string;
      type: "text" | "choice" | "boolean" | "file" | "verification";
      options?: string[];
      condition?: { dependsOnKey: string; equals: any };
      required: boolean;
      category?: string;
    }>;
  };
  requiredSignatures: string[];
  paymentRequirements: {
    advancePercent: number;
    terms: string;
    currency: string;
  };
  complianceRequirements: string[];
  communicationSequence: Array<{
    type: string;
    trigger: string;
    subject: string;
  }>;
  completionConditions: string[];
}

export const DEFAULT_SERVICE_TEMPLATES: DefaultServiceTemplateDef[] = [
  {
    name: "AI Automation Implementation",
    code: "AI_AUTOMATION",
    description: "End-to-end workflow automation, LLM agents, and CRM/ERP integrations.",
    requiredDocuments: ["WELCOME_LETTER", "NDA", "SERVICE_AGREEMENT", "DPA", "PROJECT_BRIEF"],
    requiredInformation: {
      internal: [
        { key: "price", label: "Project Price (£)", type: "currency", required: true, defaultValue: 6000, helpText: "Total agreed fee" },
        { key: "duration", label: "Project Duration", type: "dropdown", required: true, defaultValue: "3 months", options: ["1 month", "2 months", "3 months", "6 months", "Ongoing"] },
        { key: "startDate", label: "Estimated Kickoff Date", type: "date", required: true },
        { key: "accountManager", label: "Assigned Lead / Account Manager", type: "text", required: true, defaultValue: "Lead Architect" },
        { key: "advancePaymentPercent", label: "Upfront Deposit (%)", type: "dropdown", required: true, defaultValue: "50%", options: ["25%", "33%", "50%", "100%"] },
        { key: "specialConditions", label: "Special Contractual Nuances", type: "textarea", required: false, helpText: "Optional custom SLA, IP caveats, or API restrictions" },
      ],
      client: [
        { key: "technicalContact", label: "Technical Lead / POC", subtitle: "Who will coordinate technical access with our engineers?", type: "text", required: true, category: "technical" },
        { key: "requiresIntegration", label: "Do you require external CRM or Database integration?", subtitle: "e.g. HubSpot, Salesforce, PostgreSQL, Webhooks", type: "choice", options: ["Yes", "No"], required: true, category: "technical" },
        { key: "targetSystems", label: "Which systems will need automation pipelines?", type: "choice", options: ["HubSpot", "Salesforce", "Zapier / Make", "Custom REST API", "Other"], condition: { dependsOnKey: "requiresIntegration", equals: "Yes" }, required: true, category: "technical" },
        { key: "apiAccessReady", label: "Do you currently have admin or API credentials ready to share?", type: "choice", options: ["Yes - Ready now", "No - Needs internal IT clearance", "Need BritSync guidance"], condition: { dependsOnKey: "requiresIntegration", equals: "Yes" }, required: true, category: "technical" },
        { key: "brandAssets", label: "Upload Company Guidelines or Technical Architecture Specs", subtitle: "PDF, PNG, JPG, or ZIP (Max 25MB)", type: "file", required: false, category: "general" },
      ],
    },
    requiredSignatures: ["SERVICE_AGREEMENT", "NDA"],
    paymentRequirements: {
      advancePercent: 50,
      terms: "Net 14",
      currency: "GBP",
    },
    complianceRequirements: ["GDPR_DPA", "CONFIDENTIALITY_UNDERTAKING"],
    communicationSequence: [
      { type: "WELCOME", trigger: "APPROVAL", subject: "Welcome to BritSync AI — Onboarding Your Automation Project" },
      { type: "SIGNATURE_REQUEST", trigger: "APPROVAL", subject: "Action Required: Review & Sign Service Agreement" },
      { type: "PAYMENT_REMINDER", trigger: "INVOICE_ISSUED", subject: "Invoice Issued for AI Automation Project" },
      { type: "KICKOFF", trigger: "ALL_COMPLETE", subject: "Onboarding Complete: Your Strategy Kickoff Session" },
    ],
    completionConditions: [
      "ALL_REQUIRED_QUESTIONS_ANSWERED",
      "MANDATORY_DOCUMENTS_SIGNED",
      "ADVANCE_INVOICE_PAID_OR_CONFIRMED",
      "INTERNAL_APPROVAL_GRANTED",
    ],
  },
  {
    name: "Cybersecurity & Vulnerability Assessment",
    code: "CYBERSECURITY",
    description: "Infrastructure penetration testing, audit, compliance certifications and hardening.",
    requiredDocuments: ["WELCOME_LETTER", "NDA", "SERVICE_AGREEMENT", "TERMS"],
    requiredInformation: {
      internal: [
        { key: "price", label: "Audit Fee (£)", type: "currency", required: true, defaultValue: 4500 },
        { key: "duration", label: "Assessment Window", type: "dropdown", required: true, defaultValue: "4 weeks", options: ["2 weeks", "4 weeks", "8 weeks"] },
        { key: "startDate", label: "Target Audit Start", type: "date", required: true },
        { key: "accountManager", label: "Lead SecOps Engineer", type: "text", required: true },
        { key: "advancePaymentPercent", label: "Upfront Deposit (%)", type: "dropdown", required: true, defaultValue: "50%", options: ["50%", "100%"] },
      ],
      client: [
        { key: "scopeDomains", label: "Domains & IP Subnets In-Scope", subtitle: "Please list target hosts to be tested", type: "text", required: true, category: "technical" },
        { key: "productionTestingConsent", label: "Is out-of-hours testing required for production systems?", type: "choice", options: ["Yes (Off-peak only)", "No (Standard business hours OK)"], required: true, category: "compliance" },
        { key: "emergencyContact", label: "24/7 SecOps Emergency Contact Phone", type: "text", required: true, category: "compliance" },
      ],
    },
    requiredSignatures: ["SERVICE_AGREEMENT", "NDA"],
    paymentRequirements: { advancePercent: 50, terms: "Net 7", currency: "GBP" },
    complianceRequirements: ["RULES_OF_ENGAGEMENT_CONSENT"],
    communicationSequence: [
      { type: "WELCOME", trigger: "APPROVAL", subject: "Security Onboarding & Rules of Engagement" },
      { type: "SIGNATURE_REQUEST", trigger: "APPROVAL", subject: "Sign Engagement Letter & Liability Waiver" },
    ],
    completionConditions: ["MANDATORY_DOCUMENTS_SIGNED", "ALL_REQUIRED_QUESTIONS_ANSWERED"],
  },
  {
    name: "TalentBridge Staff Augmentation",
    code: "TALENT_BRIDGE",
    description: "Dedicated vetted developers, AI engineers, and technical teams on retainer.",
    requiredDocuments: ["WELCOME_LETTER", "SERVICE_AGREEMENT", "NDA", "DPA"],
    requiredInformation: {
      internal: [
        { key: "price", label: "Monthly Retainer (£)", type: "currency", required: true, defaultValue: 5000 },
        { key: "duration", label: "Initial Retainer Term", type: "dropdown", required: true, defaultValue: "6 months", options: ["3 months", "6 months", "12 months"] },
        { key: "startDate", label: "Placement Start Date", type: "date", required: true },
        { key: "accountManager", label: "Talent Delivery Manager", type: "text", required: true },
        { key: "advancePaymentPercent", label: "First Month Payment (%)", type: "dropdown", required: true, defaultValue: "100%", options: ["100%"] },
      ],
      client: [
        { key: "techStack", label: "Primary Tech Stack & Frameworks", type: "text", required: true, category: "technical" },
        { key: "workHours", label: "Required Working Timezone / Core Hours", type: "choice", options: ["UK / GMT (9am - 5pm)", "US Eastern (1pm - 9pm GMT)", "Flexible Async"], required: true, category: "general" },
      ],
    },
    requiredSignatures: ["SERVICE_AGREEMENT", "NDA"],
    paymentRequirements: { advancePercent: 100, terms: "Prepaid Monthly", currency: "GBP" },
    complianceRequirements: ["TALENT_IP_ASSIGNMENT", "GDPR_DPA"],
    communicationSequence: [
      { type: "WELCOME", trigger: "APPROVAL", subject: "Welcome to TalentBridge — Engineer Placement Process" },
    ],
    completionConditions: ["MANDATORY_DOCUMENTS_SIGNED", "ADVANCE_INVOICE_PAID_OR_CONFIRMED"],
  },
  {
    name: "Management Consultancy & Strategy",
    code: "MANAGEMENT_CONSULTANCY",
    description: "Executive advisory, AI roadmap creation, operational efficiency workshops.",
    requiredDocuments: ["WELCOME_LETTER", "NDA", "SERVICE_AGREEMENT", "PROJECT_BRIEF"],
    requiredInformation: {
      internal: [
        { key: "price", label: "Advisory Fee (£)", type: "currency", required: true, defaultValue: 8000 },
        { key: "duration", label: "Engagement Period", type: "dropdown", required: true, defaultValue: "2 months", options: ["1 month", "2 months", "3 months"] },
        { key: "startDate", label: "Kickoff Session Date", type: "date", required: true },
        { key: "accountManager", label: "Managing Consultant", type: "text", required: true },
        { key: "advancePaymentPercent", label: "Upfront Deposit (%)", type: "dropdown", required: true, defaultValue: "50%", options: ["50%", "100%"] },
      ],
      client: [
        { key: "primaryObjective", label: "What is the single highest-priority strategic goal for this engagement?", type: "text", required: true, category: "general" },
        { key: "keyStakeholders", label: "Who are the key C-suite / executive stakeholders involved?", type: "text", required: true, category: "general" },
      ],
    },
    requiredSignatures: ["SERVICE_AGREEMENT", "NDA"],
    paymentRequirements: { advancePercent: 50, terms: "Net 14", currency: "GBP" },
    complianceRequirements: ["EXECUTIVE_CONFIDENTIALITY"],
    communicationSequence: [
      { type: "WELCOME", trigger: "APPROVAL", subject: "Welcome to BritSync Strategic Advisory" },
    ],
    completionConditions: ["MANDATORY_DOCUMENTS_SIGNED", "INTERNAL_APPROVAL_GRANTED"],
  },
  {
    name: "Executive & Team Training",
    code: "TRAINING",
    description: "Corporate AI readiness workshops, prompting mastery, and technical upskilling.",
    requiredDocuments: ["WELCOME_LETTER", "SERVICE_AGREEMENT", "TERMS"],
    requiredInformation: {
      internal: [
        { key: "price", label: "Training Package (£)", type: "currency", required: true, defaultValue: 3000 },
        { key: "duration", label: "Cohort Duration", type: "dropdown", required: true, defaultValue: "2 weeks", options: ["1 day intensive", "2 weeks", "4 weeks"] },
        { key: "startDate", label: "First Workshop Date", type: "date", required: true },
        { key: "accountManager", label: "Lead Instructor", type: "text", required: true },
        { key: "advancePaymentPercent", label: "Upfront Payment (%)", type: "dropdown", required: true, defaultValue: "100%", options: ["100%"] },
      ],
      client: [
        { key: "participantCount", label: "Approximate Number of Attendees", type: "choice", options: ["1 - 5", "6 - 15", "16 - 50", "50+"], required: true, category: "general" },
        { key: "attendeeLevel", label: "Technical Competence of Audience", type: "choice", options: ["Beginner / Non-technical", "Intermediate Business Users", "Advanced Engineering Team"], required: true, category: "general" },
      ],
    },
    requiredSignatures: ["SERVICE_AGREEMENT"],
    paymentRequirements: { advancePercent: 100, terms: "Due upon booking", currency: "GBP" },
    complianceRequirements: [],
    communicationSequence: [
      { type: "WELCOME", trigger: "APPROVAL", subject: "Training Schedule & Participant Preparation" },
    ],
    completionConditions: ["MANDATORY_DOCUMENTS_SIGNED", "ADVANCE_INVOICE_PAID_OR_CONFIRMED"],
  },
  {
    name: "Digital Product Design & Dev",
    code: "DIGITAL_PRODUCT",
    description: "Custom software, MVP design, UI/UX sprints, full-stack application development.",
    requiredDocuments: ["WELCOME_LETTER", "NDA", "SERVICE_AGREEMENT", "DPA", "PROJECT_BRIEF"],
    requiredInformation: {
      internal: [
        { key: "price", label: "Build Budget (£)", type: "currency", required: true, defaultValue: 12000 },
        { key: "duration", label: "Milestone Timeline", type: "dropdown", required: true, defaultValue: "3 months", options: ["2 months", "3 months", "6 months"] },
        { key: "startDate", label: "Sprint 0 Start Date", type: "date", required: true },
        { key: "accountManager", label: "Product Manager", type: "text", required: true },
        { key: "advancePaymentPercent", label: "Deposit (%)", type: "dropdown", required: true, defaultValue: "33%", options: ["33%", "50%"] },
      ],
      client: [
        { key: "productVision", label: "Summary of MVP scope & core user workflow", type: "text", required: true, category: "technical" },
        { key: "hasFigmaDesigns", label: "Do you have existing Figma or design mockups?", type: "choice", options: ["Yes - Figma ready", "Wireframes only", "Starting from scratch"], required: true, category: "technical" },
      ],
    },
    requiredSignatures: ["SERVICE_AGREEMENT", "NDA"],
    paymentRequirements: { advancePercent: 33, terms: "Milestone-based", currency: "GBP" },
    complianceRequirements: ["IP_ASSIGNMENT", "GDPR_DPA"],
    communicationSequence: [
      { type: "WELCOME", trigger: "APPROVAL", subject: "Your Digital Product Design & Build Plan" },
    ],
    completionConditions: ["MANDATORY_DOCUMENTS_SIGNED", "ALL_REQUIRED_QUESTIONS_ANSWERED"],
  },
  {
    name: "Enterprise Custom Service",
    code: "CUSTOM",
    description: "Bespoke enterprise transformation, bespoke SLA, dedicated account team.",
    requiredDocuments: ["WELCOME_LETTER", "NDA", "SERVICE_AGREEMENT", "TERMS", "DPA"],
    requiredInformation: {
      internal: [
        { key: "price", label: "Contract Value (£)", type: "currency", required: true, defaultValue: 25000 },
        { key: "duration", label: "Contract Duration", type: "dropdown", required: true, defaultValue: "12 months", options: ["6 months", "12 months", "24 months"] },
        { key: "startDate", label: "Effective Date", type: "date", required: true },
        { key: "accountManager", label: "Executive Account Director", type: "text", required: true },
        { key: "advancePaymentPercent", label: "Initial Invoice (%)", type: "dropdown", required: true, defaultValue: "25%", options: ["25%", "50%"] },
      ],
      client: [
        { key: "procurementContact", label: "Procurement / Legal Counsel Contact", type: "text", required: true, category: "compliance" },
        { key: "billingEntityName", label: "Registered Legal Entity Name for Invoicing", type: "text", required: true, category: "general" },
      ],
    },
    requiredSignatures: ["SERVICE_AGREEMENT", "NDA", "DPA"],
    paymentRequirements: { advancePercent: 25, terms: "Net 30", currency: "GBP" },
    complianceRequirements: ["ENTERPRISE_DPA", "SECURITY_ANNEX"],
    communicationSequence: [
      { type: "WELCOME", trigger: "APPROVAL", subject: "Enterprise Partnership Onboarding Brief" },
    ],
    completionConditions: ["MANDATORY_DOCUMENTS_SIGNED", "ALL_REQUIRED_QUESTIONS_ANSWERED"],
  },
];

/**
 * Ensures all default service templates exist in the database.
 */
export async function ensureServiceTemplates() {
  for (const def of DEFAULT_SERVICE_TEMPLATES) {
    const existing = await prisma.serviceOnboardingTemplate.findUnique({
      where: { code: def.code },
    });

    if (!existing) {
      await prisma.serviceOnboardingTemplate.create({
        data: {
          name: def.name,
          code: def.code,
          description: def.description,
          isActive: true,
          requiredDocumentsJson: JSON.stringify(def.requiredDocuments),
          requiredInformationJson: JSON.stringify(def.requiredInformation),
          requiredSignaturesJson: JSON.stringify(def.requiredSignatures),
          paymentRequirementsJson: JSON.stringify(def.paymentRequirements),
          complianceRequirementsJson: JSON.stringify(def.complianceRequirements),
          communicationSequenceJson: JSON.stringify(def.communicationSequence),
          completionConditionsJson: JSON.stringify(def.completionConditions),
        },
      });
    }
  }
}

/**
 * Returns all active service onboarding templates.
 */
export async function listServiceTemplates() {
  await ensureServiceTemplates();
  return prisma.serviceOnboardingTemplate.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

/**
 * Finds template matching service name or defaults to AI_AUTOMATION.
 */
export async function findMatchingTemplate(serviceName?: string | null) {
  await ensureServiceTemplates();

  if (!serviceName) {
    return prisma.serviceOnboardingTemplate.findFirst({
      where: { code: "AI_AUTOMATION" },
    });
  }

  const query = serviceName.toLowerCase();
  const all = await prisma.serviceOnboardingTemplate.findMany({ where: { isActive: true } });

  const matched = all.find((t) => {
    const n = t.name.toLowerCase();
    const c = t.code.toLowerCase();
    return query.includes(c) || n.includes(query) || query.includes(n);
  });

  return matched || all[0];
}
