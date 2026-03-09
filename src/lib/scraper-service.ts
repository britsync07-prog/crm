import axios from "axios";
import * as cheerio from "cheerio";
import { GoogleMapsScraper } from "./google-maps-scraper";

export interface ScraperParams {
  industry: string;
  location: string;
  keyword?: string;
  maxResults?: number;
  shouldStop?: () => Promise<boolean>;
}

export interface ScrapedLead {
  companyName: string;
  email: string;
  phone: string;
  website: string;
  industry: string;
  location: string;
  source: string;
  rating?: string;
  address?: string;
}

const EMAIL_REGEX = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;
const PHONE_REGEX = /(\+?\d{1,2}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;

export async function runLeadScraper({
  industry,
  location,
  keyword = "",
  maxResults = 20,
  shouldStop,
}: ScraperParams): Promise<ScrapedLead[]> {
  const leads: ScrapedLead[] = [];
  const seenEmails = new Set<string>();
  const seenCompanies = new Set<string>();

  // --- PASS 1: Google Maps (High Quality Leads) ---
  try {
    const mapsScraper = new GoogleMapsScraper();
    await mapsScraper.init();
    const query = `${industry} ${keyword} in ${location}`.trim();
    const mapsResults = await mapsScraper.scrape(query, maxResults, shouldStop);
    
    for (const res of mapsResults) {
      const email = res.possibleEmails.length > 0 ? res.possibleEmails[0] : "";
      if (email) seenEmails.add(email.toLowerCase());
      seenCompanies.add(res.name.toLowerCase());

      leads.push({
        companyName: res.name,
        email: email,
        phone: res.phone,
        website: res.website,
        industry: industry,
        location: location,
        source: "Google Maps",
        rating: res.rating,
        address: res.address
      });
    }
    await mapsScraper.close();
  } catch (error) {
    console.error("Google Maps Scraping failed, falling back to DDG:", error);
  }

  if (shouldStop && await shouldStop()) return leads;

  // --- PASS 2: DuckDuckGo (Fallback / Additional Leads) ---
  if (leads.length < maxResults) {
    try {
      const query = `${industry} ${location} ${keyword} "@gmail.com" OR "@hotmail.com"`.trim();
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);
      $(".result").each((i, element) => {
        if (leads.length >= maxResults) return false;

        const title = $(element).find(".result__title a").text().trim();
        const snippet = $(element).find(".result__snippet").text().trim();
        const url = $(element).find(".result__title a").attr("href") || "";

        if (!title || seenCompanies.has(title.toLowerCase())) return;

        const combinedText = `${title} ${snippet}`;
        const emailMatches = combinedText.match(EMAIL_REGEX);
        const email = emailMatches ? emailMatches[0].toLowerCase() : "";

        if (email && seenEmails.has(email)) return;

        const phoneMatches = combinedText.match(PHONE_REGEX);
        const phone = phoneMatches ? phoneMatches[0] : "";

        leads.push({
          companyName: title,
          email: email,
          phone: phone,
          website: url,
          industry: industry,
          location: location,
          source: "DuckDuckGo",
        });
        
        if (email) seenEmails.add(email);
        seenCompanies.add(title.toLowerCase());
      });
    } catch (error) {
      console.error("DDG Scraping failed:", error);
    }
  }

  return leads;
}
