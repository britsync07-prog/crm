import crypto from "crypto";
import { prisma } from "@/lib/db";

export type PricingPlan = {
  id: string;
  slug: string;
  name: string;
  description: string;
  monthlyPriceCents: number | null;
  seatLimit: number | null;
  features: string[];
  stripePriceId: string | null;
  isActive: boolean;
  isPopular: boolean;
  sortOrder: number;
  trialDays: number;
  ctaLabel: string | null;
};

export type PricingOffer = {
  id: string;
  title: string;
  description: string;
  discountPercent: number;
  couponCode: string | null;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  appliesToPlanSlug: string | null;
};

export type PublicPricingPlan = PricingPlan & {
  activeOffer: PricingOffer | null;
  discountedMonthlyPriceCents: number | null;
};

const defaultPlans = [
  {
    slug: "personal",
    name: "Personal",
    description: "For small teams getting started",
    monthlyPriceCents: 7900,
    seatLimit: 2,
    isPopular: false,
    sortOrder: 10,
    trialDays: 14,
    features: [
      "Unlimited AI Sourcing Credits",
      "Unlimited AI Searches",
      "Unlimited SMTP Connections",
      "Visual Workflow Engine",
      "Sentiment AI Agents",
      "AI Writer & Cognitive SDR",
      "Unlimited Emails /mo",
      "Custom AI Training",
      "White-label Portal",
      "Enrichment API",
      "Complete CRM Suite",
      "Priority Support",
    ],
  },
  {
    slug: "business",
    name: "Business",
    description: "For growing teams scaling up",
    monthlyPriceCents: 14900,
    seatLimit: 5,
    isPopular: true,
    sortOrder: 20,
    trialDays: 14,
    features: [
      "Unlimited AI Sourcing Credits",
      "Unlimited AI Searches",
      "Unlimited SMTP Connections",
      "Visual Workflow Engine",
      "Sentiment AI Agents",
      "AI Writer & Cognitive SDR",
      "Unlimited Emails /mo",
      "Custom AI Training",
      "White-label Portal",
      "Enrichment API",
      "Complete CRM Suite",
      "Priority Support",
      "Activity Dashboard",
    ],
  },
  {
    slug: "enterprise",
    name: "Enterprise",
    description: "For large organizations",
    monthlyPriceCents: null,
    seatLimit: null,
    isPopular: false,
    sortOrder: 30,
    trialDays: 14,
    features: [
      "Everything in Business",
      "Unlimited team members",
      "Dedicated success manager",
      "Custom AI training",
      "SSO & SAML",
      "Custom integrations",
      "SLA guarantee",
      "24/7 phone support",
    ],
  },
];

type PlanRow = Omit<PricingPlan, "features" | "isActive" | "isPopular"> & {
  featuresJson: string;
  isActive: boolean | number;
  isPopular: boolean | number;
};

type OfferRow = Omit<PricingOffer, "isActive"> & {
  isActive: boolean | number;
};

export async function ensurePricingTables() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PricingPlan" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "slug" TEXT NOT NULL UNIQUE,
      "name" TEXT NOT NULL,
      "description" TEXT NOT NULL DEFAULT '',
      "monthlyPriceCents" INTEGER,
      "seatLimit" INTEGER,
      "featuresJson" TEXT NOT NULL DEFAULT '[]',
      "stripePriceId" TEXT,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "isPopular" BOOLEAN NOT NULL DEFAULT false,
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "trialDays" INTEGER NOT NULL DEFAULT 14,
      "ctaLabel" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PricingOffer" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "title" TEXT NOT NULL,
      "description" TEXT NOT NULL DEFAULT '',
      "discountPercent" INTEGER NOT NULL,
      "couponCode" TEXT,
      "startsAt" DATETIME NOT NULL,
      "endsAt" DATETIME NOT NULL,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "appliesToPlanSlug" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  for (const plan of defaultPlans) {
    await prisma.$executeRawUnsafe(
      `INSERT OR IGNORE INTO "PricingPlan"
       ("id", "slug", "name", "description", "monthlyPriceCents", "seatLimit", "featuresJson", "isPopular", "sortOrder", "trialDays", "createdAt", "updatedAt")
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      crypto.randomUUID(),
      plan.slug,
      plan.name,
      plan.description,
      plan.monthlyPriceCents,
      plan.seatLimit,
      JSON.stringify(plan.features),
      plan.isPopular ? 1 : 0,
      plan.sortOrder,
      plan.trialDays
    );
  }
}

function parsePlan(row: PlanRow): PricingPlan {
  let features: string[] = [];
  try {
    const parsed = JSON.parse(row.featuresJson || "[]");
    features = Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    features = [];
  }

  return {
    ...row,
    features,
    isActive: Boolean(row.isActive),
    isPopular: Boolean(row.isPopular),
  };
}

function parseOffer(row: OfferRow): PricingOffer {
  return {
    ...row,
    isActive: Boolean(row.isActive),
  };
}

export async function getPricingPlans({ activeOnly = false } = {}) {
  await ensurePricingTables();
  const rows = await prisma.$queryRawUnsafe<PlanRow[]>(
    `SELECT * FROM "PricingPlan" ${activeOnly ? "WHERE isActive = 1" : ""} ORDER BY "sortOrder" ASC, "monthlyPriceCents" ASC`
  );
  return rows.map(parsePlan);
}

export async function getPricingOffers({ activeOnly = false } = {}) {
  await ensurePricingTables();
  const rows = await prisma.$queryRawUnsafe<OfferRow[]>(
    `SELECT * FROM "PricingOffer" ${activeOnly ? "WHERE isActive = 1" : ""} ORDER BY "startsAt" DESC`
  );
  return rows.map(parseOffer);
}

export function getActiveOfferForPlan(planSlug: string, offers: PricingOffer[], now = new Date()) {
  const nowTime = now.getTime();
  return (
    offers.find((offer) => {
      const starts = new Date(offer.startsAt).getTime();
      const ends = new Date(offer.endsAt).getTime();
      const planMatches = !offer.appliesToPlanSlug || offer.appliesToPlanSlug === planSlug;
      return offer.isActive && planMatches && starts <= nowTime && ends >= nowTime;
    }) || null
  );
}

export async function getPublicPricingPlans() {
  const [plans, offers] = await Promise.all([
    getPricingPlans({ activeOnly: true }),
    getPricingOffers({ activeOnly: true }),
  ]);

  return plans.map((plan): PublicPricingPlan => {
    const activeOffer = getActiveOfferForPlan(plan.slug, offers);
    const discountedMonthlyPriceCents =
      activeOffer && plan.monthlyPriceCents !== null
        ? Math.max(0, Math.round(plan.monthlyPriceCents * (1 - activeOffer.discountPercent / 100)))
        : plan.monthlyPriceCents;

    return { ...plan, activeOffer, discountedMonthlyPriceCents };
  });
}

export async function getCheckoutPlanConfig(slug: string) {
  const plans = await getPublicPricingPlans();
  const plan = plans.find((item) => item.slug === slug && item.monthlyPriceCents !== null);
  if (!plan) return null;

  return {
    slug: plan.slug,
    name: plan.name,
    amount: plan.monthlyPriceCents!,
    seats: plan.seatLimit || 1,
    trialDays: plan.trialDays,
    stripePriceId: plan.stripePriceId,
    activeOffer: plan.activeOffer,
  };
}
