import { NextResponse } from "next/server";
import { runLeadScraper } from "@/lib/scraper-service";
import { prisma as db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { industry, location, keyword } = await req.json();

    if (!industry || !location) {
      return NextResponse.json({ error: "Industry and location are required" }, { status: 400 });
    }

    // Create a ScrapeJob to track progress
    const job = await db.scrapeJob.create({
      data: {
        userId: user.id,
        status: "Running",
        progress: 0,
        keyword: keyword || "",
        location: location,
      },
    });

    // Start background job
    (async () => {
      try {
        if (db.scrapeLog) {
          await db.scrapeLog.create({
            data: { jobId: job.id, message: `Starting search for ${industry} in ${location}...`, level: "INFO" }
          });
        }

        const shouldStop = async () => {
          const currentJob = await db.scrapeJob.findUnique({ where: { id: job.id }, select: { status: true } });
          return currentJob?.status === "Stopped";
        };

        const leads = await runLeadScraper({ industry, location, keyword, maxResults: 30, shouldStop });
        
        if (db.scrapeLog) {
          await db.scrapeLog.create({
            data: { jobId: job.id, message: `Found ${leads.length} total potential leads. Starting processing...`, level: "INFO" }
          });
        }

        let savedCount = 0;

        for (let i = 0; i < leads.length; i++) {
          const lead = leads[i];

          // Check if job was stopped
          const currentJob = await db.scrapeJob.findUnique({ where: { id: job.id }, select: { status: true } });
          if (currentJob?.status === "Stopped") {
            await db.scrapeLog.create({
              data: { jobId: job.id, message: "Scrape job stopped by user.", level: "WARN" }
            });
            return;
          }

          // Defensive Mapping: Only map fields that exist in our schema to prevent Prisma errors
          const leadData = {
            userId: user.id,
            name: lead.companyName,
            email: lead.email || `no-email-${lead.companyName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}@scraped.com`,
            phone: lead.phone || null,
            company: lead.companyName || null,
            website: lead.website || null,
            industry: lead.industry || null,
            location: lead.location || null,
            address: lead.address || null,
            rating: lead.rating || null,
            source: "Scraper",
            scrapeJobId: job.id,
            status: "New"
          };

          // Check for existing
          const existing = await db.lead.findFirst({
            where: {
              OR: [
                { email: leadData.email },
                { company: leadData.company, website: leadData.website }
              ]
            }
          });

          if (!existing) {
            try {
              await db.lead.create({
                data: leadData
              });
              savedCount++;
              
              if (savedCount % 5 === 0) {
                await db.scrapeLog.create({
                  data: { jobId: job.id, message: `Processed ${i + 1}/${leads.length} leads. Saved ${savedCount} new leads.`, level: "INFO" }
                });
              }
            } catch (createError) {
              console.error("Failed to save lead:", leadData.name, createError);
              await db.scrapeLog.create({
                data: { jobId: job.id, message: `Error saving lead ${leadData.name}: ${String(createError)}`, level: "ERROR" }
              });
            }
          }
          
          // Update progress
          await db.scrapeJob.update({
            where: { id: job.id },
            data: { progress: Math.floor(((i + 1) / leads.length) * 100) }
          });
        }

        await db.scrapeJob.update({
          where: { id: job.id },
          data: { 
            status: "Completed", 
            progress: 100,
            totalLeads: savedCount,
            message: `Successfully scraped ${savedCount} leads.`
          }
        });

        await db.scrapeLog.create({
          data: { jobId: job.id, message: `Scrape job completed. Saved ${savedCount} leads.`, level: "INFO" }
        });

      } catch (error: any) {
        console.error("Background scrape job failed:", error);
        await db.scrapeJob.update({
          where: { id: job.id },
          data: { status: "Failed", message: error.message || "Unknown error" }
        });
        await db.scrapeLog.create({
          data: { jobId: job.id, message: `Critical error: ${error.message}`, level: "ERROR" }
        });
      }
    })();

    return NextResponse.json({ success: true, jobId: job.id, message: "Scraping started in background" });
  } catch (error: any) {
    console.error("Scrape API Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
