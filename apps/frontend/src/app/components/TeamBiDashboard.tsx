import { useMemo } from "react";
import {
  CheckCircle2,
  Users,
  Building2,
  UserX,
} from "lucide-react";
import { Card, CardContent } from "./ui/card";

type TeamData = {
  _id: string;
  name: string;
  members?: any[];
  isActive: boolean;
};

type Props = {
  teams: TeamData[];
};

export function TeamBiDashboard({ teams }: Props) {
  const summary = useMemo(() => {
    const total = teams.length;
    const active = teams.filter((t) => t.isActive).length;
    const inactive = total - active;
    const totalMembers = teams.reduce(
      (s, t) => s + (t.members?.length || 0),
      0
    );
    const avgMembers =
      total > 0 ? Math.round((totalMembers / total) * 10) / 10 : 0;
    const teamsWithMembers = teams.filter(
      (t) => (t.members?.length || 0) > 0
    ).length;

    return { total, active, inactive, totalMembers, avgMembers, teamsWithMembers };
  }, [teams]);

  const cards = [
    {
      title: "Total Teams",
      value: summary.total,
      icon: Building2,
      tone: "from-blue-600 to-cyan-500",
    },
    {
      title: "Active Teams",
      value: summary.active,
      icon: CheckCircle2,
      tone: "from-emerald-600 to-lime-500",
    },
    {
      title: "Inactive Teams",
      value: summary.inactive,
      icon: UserX,
      tone: "from-amber-500 to-orange-400",
    },
    {
      title: "Total Members",
      value: summary.totalMembers,
      icon: Users,
      tone: "from-violet-600 to-fuchsia-500",
    },
  ];

  return (
    <div className="space-y-5">
      {/* ── Header banner ── */}
      <Card className="border-none shadow-xl bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white overflow-hidden">
        <CardContent className="pt-6 pb-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-blue-200">
                Teams BI
              </p>
              <h2 className="text-2xl font-bold">
                Welcome to Smart Site Teams
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                Real-time overview of all teams and members.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── KPI cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.tone} p-5 shadow-lg hover:shadow-xl transition-shadow duration-300`}
          >
            {/* decorative circles */}
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
            <div className="absolute -right-1 -bottom-6 h-16 w-16 rounded-full bg-white/10" />

            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-white/70">
                  {card.title}
                </p>
                <p className="mt-2 text-4xl font-extrabold text-white leading-none">
                  {card.value}
                </p>
              </div>
              <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                <card.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
