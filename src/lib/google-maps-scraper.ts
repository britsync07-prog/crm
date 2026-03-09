import puppeteer from "puppeteer";

export interface GoogleMapsLead {
  name: string;
  address: string;
  phone: string;
  rating: string;
  website: string;
  referenceLink: string;
  possibleEmails: string[];
}

export class GoogleMapsScraper {
  private browser: any = null;

  async init() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-notifications"],
    });
  }

  async scrape(searchQuery: string, maxResults: number = 20, shouldStop?: () => Promise<boolean>): Promise<GoogleMapsLead[]> {
    if (!this.browser) await this.init();

    const page = await this.browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    try {
      console.log(`Scraping Google Maps for: ${searchQuery}`);
      const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}?hl=en`;
      await page.goto(searchUrl, { waitUntil: "networkidle2", timeout: 60000 });

      if (shouldStop && await shouldStop()) throw new Error("STOPPED");

      // Check if we are being blocked or redirected
      const title = await page.title();
      console.log(`Page title: ${title}`);
      if (title.includes("Consent") || title.includes("Before you continue")) {
        console.log("Handling Google consent page...");
        const buttons = await page.$$('button');
        for (const button of buttons) {
          const text = await page.evaluate((el: any) => el.textContent, button);
          if (text.includes("Accept all")) {
            await button.click();
            await page.waitForNavigation({ waitUntil: "networkidle2" });
            break;
          }
        }
      }

      // Scroll to load results
      await this.scrollResults(page, maxResults, shouldStop);

      // Extract data
      const businesses = await page.evaluate(() => {
        const results: any[] = [];
        const businessCards = document.querySelectorAll('.Nv2PK');
        console.log(`Found ${businessCards.length} business cards on page`);

        for (let i = 0; i < businessCards.length; i++) {
          const card = businessCards[i];
          const nameElement = card.querySelector('.qBF1Pd.fontHeadlineSmall');
          const name = nameElement ? nameElement.textContent?.trim() : '';

          let referenceLink = '';
          const mainLink = card.querySelector('a.hfpxzc') as HTMLAnchorElement;
          if (mainLink) referenceLink = mainLink.href;

          let website = '';
          const websiteButton = card.querySelector('a[data-value="Website"]') as HTMLAnchorElement;
          if (websiteButton) website = websiteButton.href;

          let rating = '';
          const ratingElement = card.querySelector('.MW4etd');
          if (ratingElement) rating = ratingElement.textContent?.trim() || '';

          let address = '';
          let phone = '';

          const infoContainers = card.querySelectorAll('.W4Efsd');
          infoContainers.forEach(container => {
            const text = container.textContent || '';
            const phoneMatch = text.match(/(\+\d{1,4}[\s.-]?)?(\(?\d{2,6}\)?[\s.-]?)?(\d{2,6}[\s.-]?){1,4}\d{2,6}/);

            if (phoneMatch && text.includes(phoneMatch[0])) {
              if (phoneMatch[0].replace(/\D/g, '').length >= 7) {
                phone = phoneMatch[0];
              }
            }

            // Simple address detection
            if (text.includes('·') && !text.includes('(') && !text.includes('Closed') && !text.includes('Open')) {
              const parts = text.split('·');
              for (const part of parts) {
                if (!part.match(/\d{3}[\s.-]?\d{4}/) && part.trim().length > 5) {
                  address = part.trim();
                }
              }
            }
          });

          if (name) {
            results.push({
              name, address, phone, rating, website, referenceLink
            });
          }
        }
        return results;
      });

      const finalLeads: GoogleMapsLead[] = [];
      for (const b of businesses) {
        if (finalLeads.length >= maxResults) break;
        if (shouldStop && await shouldStop()) break;
        
        let possibleEmails: string[] = [];
        if (b.website) {
          possibleEmails = await this.findEmails(b.website);
        }

        finalLeads.push({
          ...b,
          possibleEmails
        });
      }

      await page.close();
      return finalLeads;

    } catch (error: any) {
      if (error.message === "STOPPED") {
        console.log("Scrape cancelled mid-execution.");
      } else {
        console.error("Maps scrape error:", error);
      }
      if (page) await page.close();
      return [];
    }
  }

  private async scrollResults(page: any, maxResults: number, shouldStop?: () => Promise<boolean>) {
    try {
      const scrollSelectors = ['[role="feed"]', '.m6QErb.DxyBCb.kA9KIf.dS8AEf.XiKgde.ecceSd', '[role="main"]'];
      let scrollContainer = null;
      for (const selector of scrollSelectors) {
        scrollContainer = await page.$(selector);
        if (scrollContainer) break;
      }

      if (!scrollContainer) return;

      let previousCount = 0;
      let noChangeCount = 0;

      for (let i = 0; i < 50; i++) {
        if (shouldStop && await shouldStop()) return;

        await page.evaluate((container: any) => {
          container.scrollTop = container.scrollHeight;
        }, scrollContainer);

        await new Promise(r => setTimeout(r, 2000));
        const resultCount = await page.evaluate(() => document.querySelectorAll('.Nv2PK').length);
        
        if (resultCount >= maxResults) break;
        if (resultCount === previousCount) {
          noChangeCount++;
          if (noChangeCount >= 3) break;
        } else {
          noChangeCount = 0;
        }
        previousCount = resultCount;
      }
    } catch (e) {}
  }

  private async findEmails(url: string): Promise<string[]> {
    if (!url || !url.startsWith('http')) return [];
    let page;
    try {
      page = await this.browser.newPage();
      await page.setRequestInterception(true);
      page.on('request', (req: any) => {
        if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) req.abort();
        else req.continue();
      });

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      const emails = await page.evaluate(() => {
        const text = document.body.innerText;
        const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
        const matches = text.match(emailRegex) || [];
        const mailtoLinks = Array.from(document.querySelectorAll('a[href^="mailto:"]'))
          .map(a => (a as HTMLAnchorElement).href.replace('mailto:', '').split('?')[0]);
        return [...new Set([...matches, ...mailtoLinks])];
      });

      return emails.filter((e: string) => 
        !e.toLowerCase().endsWith('.png') && 
        !e.toLowerCase().endsWith('.jpg') &&
        !e.toLowerCase().endsWith('.jpeg')
      );
    } catch (e) {
      return [];
    } finally {
      if (page) await page.close();
    }
  }

  async close() {
    if (this.browser) await this.browser.close();
  }
}
