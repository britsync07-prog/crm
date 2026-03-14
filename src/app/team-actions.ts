"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { findLeadsInIndustry, runGeneralAIChat, runLeadCategorizationAgent } from "@/lib/ai-agents";
import { parse } from "csv-parse/sync";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function searchForLeads(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const industry = formData.get("industry") as string;
  if (!industry) return;

  await findLeadsInIndustry(industry, session.id);

  revalidatePath("/leads");
  revalidatePath("/finder");
}

export async function importLeadsFromCSV(formData: FormData) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const file = formData.get("file") as File;
    const categoryId = formData.get("categoryId") as string;
    if (!file || file.size === 0) {
      return { success: false, error: "No file provided or file is empty." };
    }

    const text = await file.text();
    if (!text.trim()) {
      return { success: false, error: "File content is empty." };
    }

    // Detect delimiter
    const firstLine = text.split("\n")[0];
    let delimiter = ",";
    if (firstLine.includes(";")) delimiter = ";";
    else if (firstLine.includes("\t")) delimiter = "\t";

    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true, 
      delimiter: delimiter,
      relax_column_count: true
    });

    if (records.length === 0) {
      return { success: false, error: "No valid records found in CSV." };
    }

    console.log(`Detected delimiter: "${delimiter}". Total records parsed: ${records.length}`);

    let importedCount = 0;
    let skippedCount = 0;

    // Detect keys once to avoid repeated searching
    const firstRecord = records[0] as Record<string, any>;
    const allKeys = Object.keys(firstRecord);
    const findKey = (keywords: string[]) => 
      allKeys.find(k => keywords.some(kw => k.toLowerCase().includes(kw)));

    const emailKey = findKey(['email', 'mail']);
    const nameKey = findKey(['name', 'person', 'contact']);
    const companyKey = findKey(['company', 'organization', 'business', 'employer']);
    const industryKey = findKey(['industry', 'category', 'sector', 'type']);
    const websiteKey = findKey(['website', 'url', 'link', 'site']);
    const phoneKey = findKey(['phone', 'mobile', 'tel', 'contact']);
    const addressKey = findKey(['address', 'location', 'city', 'street']);
    const ratingKey = findKey(['rating', 'score', 'rank']);

    for (const rec of records) {
      const record = rec as any;
      const name = (nameKey ? record[nameKey] : "").toString().trim();
      let email = (emailKey ? record[emailKey] : "").toString().trim();
      const company = (companyKey ? record[companyKey] : "").toString().trim();
      const industry = (industryKey ? record[industryKey] : "").toString().trim();
      const website = (websiteKey ? record[websiteKey] : "").toString().trim();
      const phone = (phoneKey ? record[phoneKey] : "").toString().trim();
      const address = (addressKey ? record[addressKey] : "").toString().trim();
      const rating = (ratingKey ? record[ratingKey] : "").toString().trim();

      // FALLBACK: If email wasn't found by header, scan all columns for an '@'
      if (!email || !email.includes("@")) {
        const fallbackKey = Object.keys(record).find(k => record[k] && record[k].toString().includes("@"));
        if (fallbackKey) email = record[fallbackKey].toString().trim();
      }

      // Final validation
      if (!email || !email.includes("@")) {
        skippedCount++;
        continue;
      }

      try {
        const lead = await prisma.lead.upsert({
          where: { email: email.toLowerCase().trim() },
          update: { 
            name: name || "Unknown Name", 
            company, 
            industry, 
            website,
            phone,
            address,
            rating,
            categoryId: categoryId || undefined
          },
          create: { 
            userId: session.id,
            name: name || "Unknown Name", 
            email: email.toLowerCase().trim(), 
            company, 
            industry, 
            website,
            phone,
            address,
            rating,
            source: "CSV Import",
            categoryId: categoryId || undefined
          },
        });

        // Trigger AI Categorization
        await runLeadCategorizationAgent(lead.id);

        importedCount++;
      } catch (rowError: any) {
        console.error("Row Import Failed:", email, rowError.message);
        skippedCount++;
      }
    }

    revalidatePath("/leads");
    return { 
      success: true, 
      message: `Successfully imported and AI-categorized ${importedCount} leads.${skippedCount > 0 ? ` Skipped ${skippedCount} invalid rows.` : ""}` 
    };
  } catch (error: any) {
    console.error("CSV Import Error:", error);
    return { success: false, error: error.message || "An unexpected error occurred during import." };
  }
}

export async function sendTeamMessage(formData: FormData) {
  const content = formData.get("content") as string;
  const teamId = formData.get("teamId") as string;
  const senderName = formData.get("senderName") as string;

  if (!content || !teamId) return;

  await prisma.message.create({
    data: {
      content,
      teamId,
      senderName,
    },
  });

  // AI Response Trigger
  if (content.toLowerCase().includes("@gemini")) {
    const aiResponse = await runGeneralAIChat(content.replace(/@gemini/gi, "").trim());
    
    await prisma.message.create({
      data: {
        content: aiResponse,
        teamId,
        senderName: "Gemini AI",
      },
    });
  }

  revalidatePath("/team");
}

export async function addTeamMember(formData: FormData) {
  const teamId = formData.get("teamId") as string;
  const name = formData.get("name") as string;
  const role = formData.get("role") as string;

  if (!teamId || !name) return;

  await prisma.member.create({
    data: {
      teamId,
      name,
      role: role || "MEMBER",
    },
  });

  revalidatePath("/team");
}

export async function removeTeamMember(memberId: string) {
  await prisma.member.delete({
    where: { id: memberId },
  });

  revalidatePath("/team");
}
