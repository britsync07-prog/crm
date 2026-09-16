import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import LeadsPageClient from "./LeadsPageClient";

const CANONICAL_STATUS_MAP: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  inbound: "Inbound Client",
  "inbound client": "Inbound Client",
  meeting_booked: "Meeting Booked",
  "meeting booked": "Meeting Booked",
  qualified: "Qualified",
  converted: "Converted",
};

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ categoryId?: string; status?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const userId = session.id;
  const { categoryId, status } = await searchParams;

  const canonicalStatus = status
    ? CANONICAL_STATUS_MAP[status.trim().toLowerCase()] || status.trim()
    : undefined;

  const [leads, categories] = await Promise.all([
    prisma.lead.findMany({
      where: { 
        userId,
        ...(categoryId ? { categoryId } : {}),
        ...(canonicalStatus ? { status: canonicalStatus } : {}),
      },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      where: { userId },
      orderBy: { name: "asc" }
    })
  ]);

  return (
    <LeadsPageClient 
      initialLeads={leads} 
      categories={categories} 
      activeCategoryId={categoryId} 
      activeStatus={canonicalStatus}
    />
  );
}
