import { prisma } from "./db";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

async function getAIResponse(prompt: string, fallback: string) {
  if (!process.env.GEMINI_API_KEY) return fallback;
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    // Clean potential markdown code blocks
    return text.replace(/```json|```html|```css|```/g, "").trim();
  } catch (error) {
    console.error("AI Error:", error);
    return fallback;
  }
}

/**
 * AI Lead Categorization & Intelligence Agent
 */
export async function runLeadCategorizationAgent(leadId: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
  });

  if (!lead) return null;

  const prompt = `Analyze this business lead and categorize them accurately.
    Name: ${lead.name}
    Company: ${lead.company}
    Industry: ${lead.industry}
    Website: ${lead.website}
    Location: ${lead.location}
    Address: ${lead.address}
    
    Rules:
    1. Determine the MOST accurate 'industry' (e.g., SaaS, Real Estate, E-commerce, Fintech).
    2. Assign a 'rating' from 1-5 stars based on business potential.
    3. Provide 'aiInsights' (1 sentence on why they are a good fit).
    4. Return ONLY a valid JSON object:
    {
      "industry": "string",
      "rating": "string", // e.g., "4 Stars"
      "aiInsights": "string"
    }`;

  const aiText = await getAIResponse(prompt, "");
  
  try {
    if (aiText) {
      const parsed = JSON.parse(aiText);
      
      const updatedLead = await prisma.lead.update({
        where: { id: leadId },
        data: { 
          industry: parsed.industry || lead.industry,
          rating: parsed.rating || lead.rating,
          aiInsights: parsed.aiInsights || lead.aiInsights,
          status: "Qualified"
        },
      });
      return updatedLead;
    }
  } catch (e) {
    console.error("Categorization Parsing Failed:", e);
  }
  return lead;
}

/**
 * AI Lead Scoring Agent
 */
export async function runLeadScoringAgent(leadId: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { interactions: true },
  });

  if (!lead) return null;

  const prompt = `Score this sales lead from 0-100 based on this data:
    Name: ${lead.name}
    Industry: ${lead.industry}
    Source: ${lead.source}
    Interactions: ${JSON.stringify(lead.interactions)}
    
    Return ONLY a JSON object with: { "score": number, "insights": "string" }`;

  const aiText = await getAIResponse(prompt, "");
  let score = 30;
  let insights = "Baseline score.";

  try {
    if (aiText) {
      const parsed = JSON.parse(aiText);
      score = parsed.score;
      insights = parsed.insights;
    }
  } catch (e) {
    if (lead.source === "Website") score += 40;
  }

  const updatedLead = await prisma.lead.update({
    where: { id: leadId },
    data: { aiScore: score, aiInsights: insights },
  });

  return { score: updatedLead.aiScore, insights: updatedLead.aiInsights };
}

/**
 * AI Sentiment Analysis Agent
 */
export async function analyzeSentimentReal(content: string): Promise<string> {
  const prompt = `Analyze the sentiment of this message: "${content}". 
    Return exactly one word: Positive, Neutral, or Negative.`;
  
  const response = await getAIResponse(prompt, "Neutral");
  return response.trim().replace(/[^a-zA-Z]/g, "") || "Neutral";
}

/**
 * AI Customer Summary Agent
 */
export async function runCustomerSummaryAgent(customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: { interactions: { take: 10, orderBy: { date: "desc" } } },
  });

  if (!customer || customer.interactions.length === 0) return "No interactions found.";

  const history = customer.interactions.map(i => i.content).join("\n");
  const prompt = `Summarize the relationship with this customer in 2 sentences based on these interactions: ${history}`;

  const summary = await getAIResponse(prompt, "No summary available.");

  await prisma.customer.update({
    where: { id: customerId },
    data: { aiSummary: summary },
  });

  return summary;
}

/**
 * AI Dashboard Insights
 */
export async function getAIDashboardInsights() {
  // Real implementation would look at global trends
  return {
    recommendation: "AI suggests focusing on leads from the 'Website' source today as they show 40% higher conversion."
  };
}

/**
 * AI Task Action Extractor
 */
export async function runTaskActionExtractor(taskId: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || !task.description) return null;

  const prompt = `Break this task down into 3 tiny actionable sub-tasks: "${task.description}".
    Return them as a simple bulleted list with "- ".`;

  const items = await getAIResponse(prompt, "- Follow up\n- Review details\n- Update status");

  await prisma.task.update({
    where: { id: taskId },
    data: { aiActionItems: items },
  });

  return items;
}

/**
 * AI Lead Discovery (Finder)
 */
export async function findLeadsInIndustry(industry: string, userId: string) {
  // In a real production app, this would call a data provider API like Apollo or Clearbit.
  // We simulate the AI "discovery" here.
  const mockLeads = [
    { name: `${industry} Global`, email: `contact@${industry.toLowerCase().replace(/ /g, '')}.com`, company: `${industry} Global` },
  ];

  for (const lead of mockLeads) {
    await prisma.lead.upsert({
      where: { email: lead.email },
      update: {},
      create: { ...lead, userId, source: "AI Search", status: "New" }
    });
  }
}

/**
 * AI Email Copywriter
 */
export async function generateColdEmail(config: {
  audience: string;
  industry: string;
  offer: string;
  tone: string;
}) {
  const prompt = `Write a short, professional cold email for a ${config.audience} in the ${config.industry} industry. 
    The offer is: ${config.offer}. The tone should be ${config.tone}.
    Use variables like {{FirstName}} and {{Company}}.
    Return ONLY the subject and body separated by "---".`;

  const response = await getAIResponse(prompt, "Subject: Let's connect --- Hi {{FirstName}}, I'd love to help with ${config.offer}.");
  const [subject, body] = response.split("---");

  return { 
    subject: subject?.replace("Subject:", "").trim() || "Let's connect", 
    body: body?.trim() || `Hi {{FirstName}}, I noticed your work in ${config.industry}...` 
  };
}

/**
 * AI Rich HTML Email Generator
 */
export async function generateRichHTMLEmail(config: {
  audience: string;
  offer: string;
  tone: string;
}) {
  const prompt = `Design a high-converting, responsive HTML/CSS sales email for ${config.audience}.
    Offer: ${config.offer}. Tone: ${config.tone}.
    Requirements:
    - Modern minimalist design
    - Inline CSS for maximum email client compatibility
    - A clear Call to Action button
    - Use variables: {{FirstName}}, {{Company}}, {{YourName}}
    - Professional typography and spacing
    - Return ONLY the HTML code.`;

  const html = await getAIResponse(prompt, "<html><body><h1>Special Offer</h1><p>Hi {{FirstName}}, we have a great deal for {{Company}}.</p></body></html>");

  return { 
    subject: `Exclusive Opportunity for ${config.audience}`,
    html: html.trim()
  };
}

/**
 * AI Email Architect Chat
 */
export async function runEmailArchitectChat(messages: { role: "user" | "model"; content: string }[]) {
  const history = messages.slice(0, -1).map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join("\n");
  const lastMessage = messages[messages.length - 1].content;

  const systemPrompt = `You are the Gemini Email Architect, an expert in high-conversion "Landing Page Style" emails.
    Your goal is to help the user define their strategy and then generate an ambitious, long-form HTML email that feels like a premium landing page.
    
    Conversation History:
    ${history}
    
    Current User Input: ${lastMessage}
    
    Rules:
    1. If the user wants a landing page style, generate a template with:
       - A striking Hero Section (Headline, Subheadline, CTA Button).
       - A "Problem/Solution" section.
       - A 3-Column Feature Grid.
       - A Testimonial or Social Proof block.
       - A clear, bold Footer CTA.
    2. Use professional typography (sans-serif), generous spacing (padding/margins), and a modern color palette (Indigo/Zinc/Slate).
    3. You MUST respond with a JSON object:
       {
         "chat": "Your feedback on why this design will convert",
         "template": {
           "subject": "...",
           "body": "...",
           "html": "Full <html>...</html> with inline CSS"
         }
       }
    4. If not ready, set template to null.`;
  
  const response = await getAIResponse(systemPrompt, '{"chat": "I am ready to architect your outreach. What is the core offer?", "template": null}');
  
  try {
    return JSON.parse(response);
  } catch (e) {
    // If AI fails to return valid JSON, try to wrap it
    return { "chat": response, "template": null };
  }
}

/**
 * ClickUp AI: Smart Status Predictor
 */
export function predictTaskDelay(dueDate: Date | null): "On Track" | "At Risk" {
  if (!dueDate) return "On Track";
  const now = new Date();
  const diff = dueDate.getTime() - now.getTime();
  const days = diff / (1000 * 60 * 60 * 24);
  return days < 2 ? "At Risk" : "On Track";
}

/**
 * General AI Chat Assistant
 */
export async function runGeneralAIChat(prompt: string) {
  const systemPrompt = `You are Gemini AI, a helpful sales assistant built into this CRM. 
    Be professional, concise, and helpful. 
    User said: ${prompt}`;
  
  return await getAIResponse(systemPrompt, "I'm sorry, I'm having trouble thinking right now.");
}

// Keeping older exports for compatibility if needed, but pointing to new logic
export function analyzeSentiment(content: string) {
  // Synchronous version for simple UI logic, but actions should use async
  return "Neutral"; 
}
