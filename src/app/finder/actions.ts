"use server";

import { LeadFinderService } from "@/lib/services/lead-finder.service";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { CategoryService } from "@/lib/services/category.service";
import { parse } from 'csv-parse/sync';
import axios from 'axios';

export async function getCountriesAction() {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    return await LeadFinderService.getCountries();
  } catch (error: any) {
    console.error("Error fetching countries:", error);
    return [];
  }
}

export async function getCategoriesAction() {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    return await CategoryService.getCategories(session.id);
  } catch (error: any) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export async function createCategoryAction(name: string) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    return await CategoryService.findOrCreateCategory(session.id, name);
  } catch (error: any) {
    console.error("Error creating category:", error);
    throw new Error("Failed to create category");
  }
}

export async function getLocationsAction(country: string) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const data = await LeadFinderService.getLocations(country);
    return data || { states: [] };
  } catch (error: any) {
    console.error(`Error fetching locations for ${country}:`, error);
    return { states: [] };
  }
}

export async function startLeadFinderJobAction(country: string, states: string[], niches: string[], categoryId?: string) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const result = await LeadFinderService.startJob(country, states, niches);

    // Persist the job in the database
    if (result && result.jobId) {
      await prisma.scrapeJob.create({
        data: {
          id: result.jobId, // We use the external ID as our internal ID for simplicity
          userId: session.id,
          status: "Running",
          location: `${country}${states.length > 0 ? ': ' + states.join(', ') : ''}`,
          keyword: niches.join(', '),
          message: categoryId || null, // Store categoryId here for now to avoid schema change
        }
      });
    }

    return result;
  } catch (error: any) {
    console.error("Error starting job:", error);
    throw new Error(error.response?.data?.message || "Failed to start scraping job");
  }
}

export async function getJobStatusAction(jobId: string) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const data = await LeadFinderService.getJobStatus(jobId);

    // Sync status with DB
    await prisma.scrapeJob.updateMany({
      where: { id: jobId, userId: session.id },
      data: {
        status: data.status,
        progress: data.leadsFound, // Map leadsFound to our database progress field
        totalLeads: data.leadsFound, // Store absolute count
      }
    });

    return data;
  } catch (error: any) {
    console.error(`Error fetching status for job ${jobId}:`, error);
    throw new Error("Failed to fetch job status");
  }
}

export async function getAllJobsAction() {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    return await prisma.scrapeJob.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error: any) {
    console.error("Error fetching all jobs:", error);
    return [];
  }
}

export async function getLatestJobAction() {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    return await prisma.scrapeJob.findFirst({
      where: { userId: session.id },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error: any) {
    console.error("Error fetching latest job:", error);
    return null;
  }
}

export async function importScrapedLeadsAction(jobId: string) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    // 1. Get job status to find the correct CSV filename
    const jobStatus = await LeadFinderService.getJobStatus(jobId);
    const csvPath = jobStatus.files?.csv;

    if (!csvPath) {
      throw new Error("CSV file not found for this job");
    }

    // Extract filename from the path (e.g. /api/.../download/filename.csv)
    const fileName = csvPath.split('/').pop()?.split('?')[0];
    if (!fileName) throw new Error("Could not determine filename");

    const job = await prisma.scrapeJob.findUnique({
      where: { id: jobId }
    });

    if (!job) throw new Error("Job not found in database");

    const EXTERNAL_API_BASE_URL = process.env.EXTERNAL_API_BASE_URL || 'http://localhost:3000';
    const API_KEY = process.env.EXTERNAL_API_KEY;

    // 2. Download the CSV using the dynamic filename
    const response = await axios.get(`${EXTERNAL_API_BASE_URL}/api/external/jobs/${jobId}/download/${fileName}`, {
      headers: { 'x-api-key': API_KEY }
    });

    const records = parse(response.data, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      trim: true
    });

    let categoryId = job.message;
    if (!categoryId) {
      const categoryName = job.keyword?.split(',')[0] || "General Scraped";
      const cat = await CategoryService.findOrCreateCategory(session.id, categoryName);
      categoryId = cat.id;
    }

    let imported = 0;
    let skipped = 0;

    for (const record of records) {
      // Robust Case-Insensitive Mapping helper
      const getVal = (keys: string[]) => {
        const rec = record as Record<string, any>;
        const foundKey = Object.keys(rec).find(k =>
          keys.some(key => k.toLowerCase() === key.toLowerCase())
        );
        return foundKey ? rec[foundKey] : null;
      };

      const name = getVal(['Name', 'Title', 'Company', 'Business Name']) || "Unknown";
      const email = getVal(['Emails', 'Email', 'E-mail']) || "";
      const phone = getVal(['Phone', 'Phone Number', 'Telephone', 'Numbers']) || null;
      const website = getVal(['Website', 'URL', 'Link']) || null;
      const address = getVal(['Address', 'Location', 'Street']) || null;
      const rating = getVal(['Rating', 'Stars', 'Score']) || null;

      if (!email || !email.includes('@')) {
        skipped++;
        continue;
      }

      try {
        await prisma.lead.upsert({
          where: { email: email.toLowerCase().trim() },
          update: {
            categoryId: categoryId,
            industry: job.keyword,
            location: address || job.location,
          },
          create: {
            userId: session.id,
            name: name,
            email: email.toLowerCase().trim(),
            phone: phone,
            company: name !== "Unknown" ? name : null,
            website: website,
            industry: job.keyword,
            location: address || job.location,
            status: "New",
            categoryId: categoryId,
            source: "Lead Finder",
            rating: rating,
          },
        });
        imported++;
      } catch (e) {
        skipped++;
      }
    }

    revalidatePath("/leads");
    return { success: true, imported, skipped };
  } catch (error: any) {
    console.error("Error importing leads:", error);
    throw new Error(error.message || "Failed to import leads");
  }
}

export async function deleteLeadsAction(leadIds: string[]) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    await prisma.lead.deleteMany({
      where: {
        id: { in: leadIds },
        userId: session.id
      }
    });

    revalidatePath("/leads");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting leads:", error);
    throw new Error("Failed to delete leads");
  }
}

export async function deleteCategoryAction(categoryId: string) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    // We use a transaction to ensure leads are uncategorized before deleting category
    await prisma.$transaction([
      prisma.lead.updateMany({
        where: { categoryId, userId: session.id },
        data: { categoryId: null }
      }),
      (prisma as any).category.delete({
        where: { id: categoryId, userId: session.id }
      })
    ]);

    revalidatePath("/leads");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting category:", error);
    throw new Error("Failed to delete category");
  }
}
