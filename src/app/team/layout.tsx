import TeamTabs from "@/components/team/TeamTabs";

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700 pb-20 px-6 pt-20 lg:pt-8">
      <TeamTabs />
      {children}
    </div>
  );
}
