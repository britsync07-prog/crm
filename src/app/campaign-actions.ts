"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateColdEmail } from "@/lib/ai-agents";
import { sendRealEmail } from "@/lib/mailer";
import { getSession } from "@/lib/auth";

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


export async function createCampaign(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const emailAccountId = formData.get("emailAccountId") as string;
  const audience = formData.get("audience") as string;
  const industry = formData.get("industry") as string;
  const offer = formData.get("offer") as string;

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

  const leads = await prisma.lead.findMany({ where: { userId: session.id }, take: 10 });
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
  const pendingLeads = await prisma.campaignLead.findMany({
    where: { campaignId, status: "Pending" },
    include: { lead: true, campaign: true },
    take: 5,
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
