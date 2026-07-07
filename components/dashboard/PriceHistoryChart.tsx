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

  // Renders each dot; also draws a small price label ONLY when price changed vs previous point.
  // overflow="visible" on <g> lets the text escape the Recharts clip-path boundary.
  function makeDotRenderer(rows: ChartRow[]) {
    return function DotRenderer(props: Record<string, unknown>) {
      const cx = props.cx as number | undefined;
      const cy = props.cy as number | undefined;
      const index = props.index as number | undefined;
      const payload = props.payload as ChartRow | undefined;

      if (cx == null || cy == null || index == null || !payload) return <g />;

      const prevPrice = index > 0 ? rows[index - 1]?.price : undefined;
      const changed = prevPrice !== undefined && Math.round(prevPrice * 100) !== Math.round(payload.price * 100);
      const isDown  = changed && payload.price < prevPrice!;

      return (
        <g overflow="visible">
          <circle cx={cx} cy={cy} r={3} fill="white" stroke="#3b82f6" strokeWidth={1.5} />
          {changed && (
            <text
              x={cx}
              y={cy - 8}
              textAnchor="middle"
              fontSize={7}
              fontWeight={600}
              fill={isDown ? "#10b981" : "#ef4444"}
              style={{ pointerEvents: "none" }}
            >
              {payload.currency} {payload.price.toFixed(0)}
            </text>
          )}
        </g>
      );
    };
  }

  export function PriceHistoryChart() {
    const { data: flights } = useFlights();
    const [selectedId, setSelectedId] = useState<number>(1);
    const { data: history, isLoading } = usePriceHistory(selectedId);

    const points = history?.points ?? [];
    const rows = toChartRows(points);
    const hasData = rows.length > 0;

    const first = rows[0]?.price;
    const last  = rows[rows.length - 1]?.price;
    const dropped = hasData && first !== undefined && last !== undefined && last < first;
    const diff    = hasData && first !== undefined && last !== undefined ? first - last : 0;
    const currency = rows[0]?.currency ?? null;

    const DotRenderer = makeDotRenderer(rows);

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
                <span className={`flex items-center gap-1 text-xs font-medium ${dropped ? "text-emerald-600" : "text-red-500"}`}>
                  {dropped ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                  {dropped ? "−" : "+"}
                  {formatCurrency(Math.abs(diff), currency)} since first check
                </span>
              )}
            </div>

            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={rows} margin={{ top: 24, right: 8, bottom: 60, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 9, fill: "#94a3b8", angle: -90, textAnchor: "end" }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                  height={65}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  width={50}
                  tickFormatter={(v: number) => currency ? `${currency} ${v.toFixed(0)}` : String(v)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={DotRenderer}
                  activeDot={{ r: 4, fill: "#3b82f6" }}
                  animationDuration={600}
                />
              </LineChart>
            </ResponsiveContainer>

            <p className="text-xs text-gray-400 mt-1 text-right">
              {points.length} check{points.length !== 1 ? "s" : ""} recorded
            </p>
          </>
        )}
      </div>
    );
  }
  