import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import NewLeadForm from "./NewLeadForm";

export default async function NewLeadPage({
  searchParams,
}: {
  searchParams: Promise<{ categoryId?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { categoryId } = await searchParams;

  const categories = await prisma.category.findMany({
    where: { userId: session.id },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href="/leads"
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
        >
          ← Cancel
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">New Lead</h1>
      </div>

      <NewLeadForm categories={categories} defaultCategoryId={categoryId} />
    </div>
  );
}
