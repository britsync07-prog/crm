import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import LeadsPageClient from "./LeadsPageClient";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ categoryId?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const userId = session.id;
  const { categoryId } = await searchParams;

  const [leads, categories] = await Promise.all([
    prisma.lead.findMany({
      where: { 
        userId,
        ...(categoryId ? { categoryId } : {})
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
    />
  );
}
