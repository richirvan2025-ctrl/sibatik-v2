"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export interface RatingDistribution {
  star: number;
  count: number;
}

export interface AgentPerformance {
  agentId: string;
  agentName: string;
  ticketCount: number;
  resolvedCount: number;
  ratingDistribution: RatingDistribution[];
}

interface Props {
  data: AgentPerformance[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-md text-xs">
      <p className="font-semibold text-[#1E293B] mb-1">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: <span className="font-bold">{entry.value}</span>
        </p>
      ))}
    </div>
  );
};

function StarRating({ star }: { star: number }) {
  return (
    <span className="text-amber-400">
      {Array.from({ length: star }).map((_, i) => (
        <span key={i}>★</span>
      ))}
      {Array.from({ length: 5 - star }).map((_, i) => (
        <span key={i} className="text-[#E2E8F0]">★</span>
      ))}
    </span>
  );
}

export function AgentPerformanceChart({ data }: Props) {
  const chartData = data.map((d) => ({
    name: d.agentName.split(" ").slice(0, 2).join(" "),
    "Tiket Masuk": d.ticketCount,
    "Tiket Selesai": d.resolvedCount,
  }));

  return (
    <div className="space-y-6">
      {/* Bar Chart: Tiket Masuk vs Selesai */}
      <div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: "#64748B" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#94A3B8" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" iconSize={8} />
            <Bar dataKey="Tiket Masuk" fill="#7C3AED" radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Bar dataKey="Tiket Selesai" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Rating Distribution per Agent */}
      <div>
        <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-3">Rating Kepuasan</p>
        <div className="space-y-3">
          {data.map((agent) => {
            const totalRated = agent.ratingDistribution.reduce((sum, r) => sum + r.count, 0);
            return (
              <div key={agent.agentId} className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
                <p className="text-[13px] font-semibold text-[#1E293B] mb-2">{agent.agentName}</p>
                {totalRated === 0 ? (
                  <p className="text-xs text-[#94A3B8]">Belum ada rating bulan ini</p>
                ) : (
                  <div className="flex flex-col gap-1">
                    {agent.ratingDistribution.map((r) => (
                      <div key={r.star} className="flex items-center gap-2">
                        <StarRating star={r.star} />
                        <span className="text-xs text-[#64748B] w-6 text-right font-medium">({r.count})</span>
                        {r.count > 0 && (
                          <div className="flex-1 h-1.5 rounded-full bg-[#E2E8F0] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-amber-400"
                              style={{ width: `${(r.count / totalRated) * 100}%` }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
