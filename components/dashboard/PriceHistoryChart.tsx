"use client";

import { useState } from "react";
import { TrendingDown, TrendingUp, BarChart2 } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { useFlights, usePriceHistory } from "@/lib/api";
import { ChartSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatChartDate } from "@/lib/format";
import type { PriceHistoryPoint } from "@/lib/types";

interface ChartRow {
  date: string;
  price: number;
  rawDate: string;
  currency: string;
  offerCount: number;
}

function toChartRows(points: PriceHistoryPoint[]): ChartRow[] {
  return points.map((p) => ({
    date: formatChartDate(p.searched_at),
    price: p.min_price,
    rawDate: p.searched_at,
    currency: p.currency,
    offerCount: p.offer_count,
  }));
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: ChartRow }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      <p className="text-gray-900 font-bold">{formatCurrency(row.price, row.currency)}</p>
      <p className="text-gray-400 mt-0.5">{row.offerCount} offer{row.offerCount !== 1 ? "s" : ""}</p>
    </div>
  );
}

export function PriceHistoryChart() {
  const { data: flights } = useFlights();
  const [selectedId, setSelectedId] = useState<number>(1);
  const { data: history, isLoading } = usePriceHistory(selectedId);

  const points = history?.points ?? [];
  const rows = toChartRows(points);
  const hasData = rows.length > 0;

  const first = rows[0]?.price;
  const last = rows[rows.length - 1]?.price;
  const dropped = hasData && first !== undefined && last !== undefined && last < first;
  const diff = hasData && first !== undefined && last !== undefined ? first - last : 0;
  const currency = rows[0]?.currency ?? null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Price History</h2>
          <p className="text-xs text-gray-400 mt-0.5">Lowest fare per check run</p>
        </div>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(Number(e.target.value))}
          className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {(flights ?? []).map((f) => (
            <option key={f.id} value={f.id}>
              {f.origin} → {f.destination}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <ChartSkeleton />
      ) : !hasData ? (
        <EmptyState
          icon={<BarChart2 className="w-6 h-6" />}
          title="No history yet"
          description="Run a price check to start tracking"
        />
      ) : (
        <>
          <div className="flex items-baseline gap-3 mb-5">
            <span className="text-2xl font-bold text-gray-900">
              {formatCurrency(last ?? null, currency)}
            </span>
            {diff !== 0 && (
              <span
                className={`flex items-center gap-1 text-xs font-medium ${
                  dropped ? "text-emerald-600" : "text-red-500"
                }`}
              >
                {dropped ? (
                  <TrendingDown className="w-3.5 h-3.5" />
                ) : (
                  <TrendingUp className="w-3.5 h-3.5" />
                )}
                {dropped ? "−" : "+"}
                {formatCurrency(Math.abs(diff), currency)} since first check
              </span>
            )}
          </div>

          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={rows} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="phGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                width={50}
                tickFormatter={(v: number) =>
                  currency ? `${currency} ${v.toFixed(0)}` : String(v)
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: "white", stroke: "#3b82f6", strokeWidth: 2 }}
                activeDot={{ r: 5, fill: "#3b82f6" }}
                animationDuration={600}
              />
            </LineChart>
          </ResponsiveContainer>

          <p className="text-xs text-gray-400 mt-3 text-right">
            {points.length} check{points.length !== 1 ? "s" : ""} recorded
          </p>
        </>
      )}
    </div>
  );
}
