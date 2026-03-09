import puppeteer from "puppeteer";

async function main() {
  console.log("Launching browser...");
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-notifications"],
    });
    console.log("Browser launched successfully");
    const page = await browser.newPage();
    console.log("New page opened");
    await page.goto("https://www.google.com/maps", { waitUntil: "networkidle2" });
    console.log("Google Maps loaded");
    await browser.close();
    console.log("Browser closed");
  } catch (e: any) {
    console.error("Puppeteer failed:", e.message);
  }
}

main();
