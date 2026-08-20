"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateColdEmail } from "@/lib/ai-agents";
import { sendRealEmail, verifySmtpConnection } from "@/lib/mailer";
import { verifyImapConnection } from "@/lib/imap";
import { getSession } from "@/lib/auth";
import { LEAD_STAGES, transitionLeadStage } from "@/lib/crm-lifecycle";

export async function addEmailAccount(
  _prevState: { error: string | null; success: boolean },
  formData: FormData
) {
  try {
    const session = await getSession();
    if (!session) return { error: "Unauthorized", success: false };

    const email = (formData.get("email") as string).trim();
    const host = (formData.get("host") as string).trim();
    const port = parseInt(formData.get("port") as string);
    const imapHost = formData.get("imapHost") ? (formData.get("imapHost") as string).trim() : null;
    const imapPortString = formData.get("imapPort") as string;
    const imapPort = imapPortString ? parseInt(imapPortString) : null;
    const username = (formData.get("username") as string).trim();
    const password = (formData.get("password") as string).trim();
    const encryption = formData.get("encryption") as string;

    if (!email || !host || !port || !imapHost || !imapPort || !username || !password) {
      return { error: "All SMTP and IMAP fields are required.", success: false };
    }

    if (!Number.isFinite(port) || !Number.isFinite(imapPort)) {
      return { error: "SMTP and IMAP ports must be valid numbers.", success: false };
    }

    const existingAccount = await prisma.emailAccount.findUnique({
      where: { email },
      select: { userId: true },
    });
    if (existingAccount && existingAccount.userId !== session.id) {
      return { error: "This mailbox is already connected to another CRM user.", success: false };
    }

    await verifySmtpConnection({ host, port, username, password, encryption });
    await verifyImapConnection({ imapHost, imapPort, username, password, encryption });

    await prisma.emailAccount.upsert({
      where: { email },
      update: {
        userId: session.id,
        host,
        port,
        imapHost,
        imapPort,
        username,
        password,
        encryption,
        isActive: true
      },
      create: {
        userId: session.id,
        email,
        host,
        port,
        imapHost,
        imapPort,
        username,
        password,
        encryption
      },
    });

    revalidatePath("/settings/email");
    return { error: null, success: true };
  } catch (e: any) {
    return { error: e.message ?? "Something went wrong", success: false };
  }
}


export async function deleteEmailAccount(accountId: string) {
  try {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    await prisma.emailAccount.delete({
      where: { id: accountId, userId: session.id },
    });

    revalidatePath("/settings/email");
    revalidatePath("/inbox");
    return { error: null };
  } catch (e: any) {
    return { error: e.message ?? "Failed to delete account" };
  }
}

export async function deleteAllEmailAccounts() {
  try {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    await prisma.emailAccount.deleteMany({
      where: { userId: session.id },
    });

    revalidatePath("/settings/email");
    revalidatePath("/inbox");
    return { error: null };
  } catch (e: any) {
    return { error: e.message ?? "Failed to delete accounts" };
  }
}

export async function createCampaign(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const emailAccountId = formData.get("emailAccountId") as string;
  const audience = formData.get("audience") as string;
  const industry = formData.get("industry") as string;
  const offer = formData.get("offer") as string;

  const emailAccount = await prisma.emailAccount.findFirst({
    where: { id: emailAccountId, userId: session.id, isActive: true },
    select: { id: true },
  });
  if (!emailAccount) {
    throw new Error("Select an active sender account connected to your user.");
  }

  const { subject, body } = await generateColdEmail({
    audience,
    industry,
    offer,
    tone: "Professional",
  });

  const campaign = await prisma.campaign.create({
    data: {
      userId: session.id,
      name,
      emailAccountId,
      subject,
      body,
      status: "Running",
    },
  });

  const leads = await prisma.lead.findMany({ where: { userId: session.id } });
  await prisma.campaignLead.createMany({
    data: leads.map(l => ({
      campaignId: campaign.id,
      leadId: l.id,
      status: "Pending",
    })),
  });

  revalidatePath("/campaigns");
  redirect("/campaigns");
}

export async function simulateEmailSending(campaignId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const pendingLeads = await prisma.campaignLead.findMany({
    where: { campaignId, status: "Pending", campaign: { userId: session.id } },
    include: { lead: true, campaign: true },
  });

  for (const cLead of pendingLeads) {
    try {
      if (!cLead.campaign.emailAccountId) {
        throw new Error("No email account configured for this campaign");
      }

      await sendRealEmail({
        emailAccountId: cLead.campaign.emailAccountId,
        to: cLead.lead.email,
        subject: cLead.campaign.subject,
        body: cLead.campaign.body,
        variables: {
          FirstName: cLead.lead.name.split(" ")[0],
          Company: cLead.lead.company || "your company",
          SenderName: "Sales Team",
        },
      });

      await prisma.campaignLead.update({
        where: { id: cLead.id },
        data: {
          status: "Sent",
          sentAt: new Date(),
        },
      });

      await transitionLeadStage({
        leadId: cLead.lead.id,
        nextStage: LEAD_STAGES.CONTACTED,
        reason: `Campaign outreach sent (${cLead.campaign.name})`,
      });
    } catch (error) {
      console.error(`Failed to send email to ${cLead.lead.email}:`, error);
      await prisma.campaignLead.update({
        where: { id: cLead.id },
        data: { status: "Bounced" },
      });
    }
  }

  revalidatePath("/campaigns");
}
