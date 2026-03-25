"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import { Pie } from "react-chartjs-2";
import {
  ArcElement,
  Chart as ChartJS,
  Legend,
  Tooltip,
  type Plugin,
  type ScriptableContext,
} from "chart.js";
import DashboardLayout from "@/app/ui/dashboard/layout";
import { Transaction } from "@/app/lib/google-sheets";

ChartJS.register(ArcElement, Tooltip, Legend);

const pieEdgeLabelPlugin: Plugin<"pie"> = {
  id: "pieEdgeLabelPlugin",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    const meta = chart.getDatasetMeta(0);
    const labels = chart.data.labels || [];

    ctx.save();
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "#374151";
    ctx.strokeStyle = "#9CA3AF";
    ctx.lineWidth = 1;

    const leftY: number[] = [];
    const rightY: number[] = [];

    const placeY = (arr: number[], candidate: number, minGap = 14) => {
      let y = candidate;
      while (arr.some((existing) => Math.abs(existing - y) < minGap)) {
        y += minGap;
      }
      arr.push(y);
      return y;
    };

    meta.data.forEach((arc: any, i: number) => {
      const value = Number((chart.data.datasets?.[0]?.data as number[])?.[i] || 0);
      if (!value) return;

      const centerX = arc.x;
      const centerY = arc.y;
      const midAngle = (arc.startAngle + arc.endAngle) / 2;

      // Pointer starts at slice edge
      const startX = centerX + Math.cos(midAngle) * arc.outerRadius;
      const startY = centerY + Math.sin(midAngle) * arc.outerRadius;

      // Elbow point outside the pie
      const elbowRadius = arc.outerRadius + 18;
      const elbowX = centerX + Math.cos(midAngle) * elbowRadius;
      const elbowYRaw = centerY + Math.sin(midAngle) * elbowRadius;

      const isRight = Math.cos(midAngle) >= 0;
      const labelY = isRight ? placeY(rightY, elbowYRaw) : placeY(leftY, elbowYRaw);

      const horizontal = 22;
      const labelX = isRight ? elbowX + horizontal : elbowX - horizontal;
      const text = String(labels[i] || "");

      // Leader/pointer line
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(elbowX, labelY);
      ctx.lineTo(labelX + (isRight ? -4 : 4), labelY);
      ctx.stroke();

      ctx.textAlign = isRight ? "left" : "right";
      ctx.textBaseline = "middle";
      ctx.fillText(text, labelX, labelY);
    });

    ctx.restore();
  },
};

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
  "#84CC16",
  "#F97316",
  "#14B8A6",
  "#6366F1",
  "#EC4899",
  "#22C55E",
];

export default function PaymentMethodsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const fetcher = (url: string) => fetch(url).then((r) => r.json());
  const { data, isLoading } = useSWR(session?.user?.email ? "/api/transactions" : null, fetcher, {
    dedupingInterval: 60_000,
    revalidateOnFocus: false,
    refreshInterval: 5 * 60_000,
    shouldRetryOnError: false,
  });

  const transactions: Transaction[] = (data?.transactions as Transaction[]) || [];

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (data && data.onboarded === false) {
      router.push("/new-user");
    }
  }, [data, router]);

  const grouped = useMemo(() => {
    const totals: Record<string, number> = {};

    transactions.forEach((t) => {
      const amount = Number(t.amount) || 0;
      if (amount <= 0) return; // spending only
      const key = (t.creditCard || "Unknown").toString().trim() || "Unknown";
      totals[key] = (totals[key] || 0) + amount;
    });

    return Object.entries(totals).sort(([, a], [, b]) => b - a);
  }, [transactions]);

  const totalSpent = useMemo(() => grouped.reduce((s, [, amount]) => s + amount, 0), [grouped]);

  const chartData = useMemo(() => {
    const labels = grouped.map(([card]) => card);
    const values = grouped.map(([, amount]) => amount);

    return {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: values.map((_, i) => COLORS[i % COLORS.length]),
          borderColor: "#ffffff",
          borderWidth: 2,
        },
      ],
    };
  }, [grouped]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: 52,
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (context: ScriptableContext<"pie"> & { parsed: number; label: string }) => {
              const value = Number(context.parsed || 0);
              const pct = totalSpent > 0 ? (value / totalSpent) * 100 : 0;
              return `${context.label}: $${value.toFixed(2)} (${pct.toFixed(1)}%)`;
            },
          },
        },
      },
    }),
    [totalSpent]
  );

  if (status === "loading" || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500 text-sm sm:text-base">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!session?.user?.email) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Payment Methods</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Spending grouped by values in the Card column
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Spending Share by Payment Method</h2>
            <p className="text-sm text-gray-600">Total spent: ${totalSpent.toFixed(2)}</p>
          </div>

          {grouped.length === 0 ? (
            <p className="text-sm text-gray-500">No spending data available.</p>
          ) : (
            <>
              <div className="h-[420px] max-w-3xl mx-auto">
                <Pie data={chartData} options={options as any} plugins={[pieEdgeLabelPlugin]} />
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {grouped.map(([card, amount], idx) => {
                  const pct = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
                  return (
                    <div key={card} className="flex items-center justify-between rounded border border-gray-200 px-3 py-2 text-sm">
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="inline-block h-3 w-3 rounded-full"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        <span className="truncate text-gray-700">{card}</span>
                      </div>
                      <span className="text-gray-900 font-medium">${amount.toFixed(2)} ({pct.toFixed(1)}%)</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
