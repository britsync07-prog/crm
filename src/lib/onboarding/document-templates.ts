import { prisma } from "@/lib/db";

export interface DefaultDocTemplateDef {
  type: string;
  name: string;
  requiresApproval: boolean;
  requiresSignature: boolean;
  variables: string[];
  content: string;
}

export const DEFAULT_DOCUMENT_TEMPLATES: DefaultDocTemplateDef[] = [
  {
    type: "WELCOME_LETTER",
    name: "Client Welcome Letter",
    requiresApproval: true,
    requiresSignature: false,
    variables: ["client_name", "company", "service_name", "account_manager", "start_date"],
    content: `# Welcome to BritSync, {{client_name}}!

Dear {{client_name}},

On behalf of the entire team at BritSync, we are delighted to officially welcome **{{company}}** as our valued partner for **{{service_name}}**.

We are committed to delivering outstanding results and a frictionless onboarding experience. Your designated Account Manager is **{{account_manager}}**, who will be overseeing your implementation and timeline.

### What to Expect Next:
1. **Agreement Execution**: Review and electronically sign your Service Agreement and NDA.
2. **Project Kickoff**: We will establish your kickoff date for **{{start_date}}**.
3. **Dedicated Communication**: You will have continuous visibility through our internal progress updates and secure onboarding channel.

If you have any immediate questions, feel free to reach out directly to your account team.

Warm regards,

**BritSync Operations & Delivery Team**  
*BritSync AI CRM Ecosystem*
`,
  },
  {
    type: "NDA",
    name: "Mutual Non-Disclosure Agreement",
    requiresApproval: true,
    requiresSignature: true,
    variables: ["client_name", "company", "effective_date", "jurisdiction"],
    content: `# MUTUAL NON-DISCLOSURE AGREEMENT

**THIS AGREEMENT** is made on **{{effective_date}}** between:

1. **BritSync AI Ltd**, a company registered in the United Kingdom ("BritSync"); and
2. **{{company}}**, whose primary representative is **{{client_name}}** ("Client").

### 1. Purpose
The Parties wish to explore and execute commercial, technical, and operational services relating to artificial intelligence, digital workflow integration, and software engineering (the "Permitted Purpose").

### 2. Definition of Confidential Information
"Confidential Information" means all proprietary, technical, operational, financial, or commercial information disclosed by either party to the other, whether marked confidential or reasonably understood to be confidential.

### 3. Obligations
Each party agrees to:
- Hold all Confidential Information in strict confidence.
- Not disclose Confidential Information to third parties without prior written consent.
- Apply at least reasonable care in protecting the information.
- Use the information solely for the Permitted Purpose.

### 4. Term and Termination
This Agreement shall remain in full force for a period of two (2) years from the Effective Date.

### 5. Governing Law
This Agreement and any dispute or claim arising out of or in connection with it shall be governed by and construed in accordance with the laws of **{{jurisdiction}}**.

---
**IN WITNESS WHEREOF**, the parties have caused this Agreement to be executed by their duly authorized representatives.
`,
  },
  {
    type: "SERVICE_AGREEMENT",
    name: "Master Services Agreement",
    requiresApproval: true,
    requiresSignature: true,
    variables: ["client_name", "company", "service_name", "price", "currency", "duration", "start_date", "payment_terms", "advance_percent"],
    content: `# MASTER SERVICES AGREEMENT

**CLIENT:** {{company}} (represented by {{client_name}})  
**PROVIDER:** BritSync AI Ltd  
**SERVICE:** {{service_name}}  
**EFFECTIVE DATE:** {{start_date}}  

---

### 1. Scope of Work
Provider agrees to deliver the **{{service_name}}** in accordance with the specifications agreed upon during onboarding and detailed in the associated Project Brief.

### 2. Fees & Commercial Terms
- **Total Project Fee:** {{currency}} {{price}}
- **Duration / Term:** {{duration}}
- **Upfront Deposit:** {{advance_percent}}% due upon execution.
- **Payment Terms:** {{payment_terms}} from receipt of invoice.

### 3. Responsibilities of the Client
The Client agrees to provide timely feedback, designated personnel access, and required third-party system credentials necessary for Provider to carry out the Services.

### 4. Intellectual Property
Upon receipt of full payment of all applicable fees, all custom deliverables specifically commissioned for and delivered to Client shall be assigned to the Client, excluding Provider's pre-existing software, libraries, and core AI frameworks.

### 5. Limitation of Liability
Neither party shall be liable for indirect, consequential, or punitive damages. Provider's aggregate liability under this Agreement shall not exceed the total fees paid by Client to Provider hereunder.

### 6. Signatures
By signing below, the parties agree to all terms and conditions set forth in this Agreement.
`,
  },
  {
    type: "DPA",
    name: "Data Processing Addendum (GDPR)",
    requiresApproval: true,
    requiresSignature: false,
    variables: ["company", "effective_date"],
    content: `# DATA PROCESSING ADDENDUM (GDPR / UK GDPR)

**Date:** {{effective_date}}  
**Customer:** {{company}} ("Data Controller")  
**Provider:** BritSync AI Ltd ("Data Processor")  

### 1. Scope and Subject Matter
This Data Processing Addendum ("DPA") governs the processing of personal data by Provider on behalf of Customer in connection with the agreed services.

### 2. Processor Obligations
Provider shall:
1. Process personal data solely upon documented instructions from Customer.
2. Ensure that persons authorized to process personal data have committed themselves to confidentiality.
3. Implement appropriate technical and organizational measures to ensure a level of security appropriate to the risk.
4. Assist the Controller in responding to requests for exercising data subject rights.
5. Delete or return all personal data to Customer upon termination of services, as required by law.

### 3. Sub-processors
Customer consents to Provider engaging third-party hosting and infrastructure sub-processors subject to strict equivalent obligations.
`,
  },
  {
    type: "PROJECT_BRIEF",
    name: "Executive Project Brief",
    requiresApproval: true,
    requiresSignature: false,
    variables: ["company", "service_name", "start_date", "duration", "account_manager", "price"],
    content: `# PROJECT BRIEF: {{service_name}}

**Client:** {{company}}  
**Lead:** {{account_manager}}  
**Target Kickoff:** {{start_date}}  
**Estimated Timeline:** {{duration}}  
**Total Investment:** £{{price}}  

---

### Project Objectives & High-Level Scope
Deliver tailored {{service_name}} to streamline operations, eliminate repetitive manual bottlenecks, and elevate enterprise capability.

### Milestone Schedule:
- **Phase 1 (Week 1):** Kickoff, architecture validation, and credential configuration.
- **Phase 2 (Weeks 2-3):** Implementation sprints & prototype testing.
- **Phase 3 (Final Phase):** UAT testing, internal training, and official handoff.

### Immediate Next Steps:
1. Complete digital signing of MSA and NDA.
2. Settle advance invoice.
3. Attend Scheduled Kickoff Session.
`,
  },
  {
    type: "KICKOFF_DOCUMENT",
    name: "Strategy Kickoff Agenda",
    requiresApproval: true,
    requiresSignature: false,
    variables: ["client_name", "company", "service_name", "start_date", "account_manager"],
    content: `# STRATEGY KICKOFF AGENDA

**Client:** {{company}}  
**Participant:** {{client_name}}  
**Session Lead:** {{account_manager}}  
**Date:** {{start_date}}  

### Agenda Items:
1. **Welcome & Introductions** (5 mins)
2. **Review of Objectives & Scope** (15 mins)
3. **Technical Access & System Prerequisites** (15 mins)
4. **Communication Cadence & Milestones** (10 mins)
5. **Q&A & First Sprint Launch** (15 mins)
`,
  },
];

/**
 * Ensures standard document templates exist in the database.
 */
export async function ensureDocumentTemplates() {
  for (const def of DEFAULT_DOCUMENT_TEMPLATES) {
    const existing = await prisma.documentTemplate.findUnique({
      where: { type: def.type },
    });

    if (!existing) {
      await prisma.documentTemplate.create({
        data: {
          type: def.type,
          name: def.name,
          content: def.content,
          variablesJson: JSON.stringify(def.variables),
          requiresApproval: def.requiresApproval,
          requiresSignature: def.requiresSignature,
          isActive: true,
        },
      });
    }
  }
}

/**
 * Interpolates mustache-style placeholders like {{variable}} with context data.
 */
export function interpolateVariables(template: string, data: Record<string, any>): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    const val = data[key];
    if (val === undefined || val === null) {
      return `[${key}]`;
    }
    return String(val);
  });
}
