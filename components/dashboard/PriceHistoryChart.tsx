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

  /** Keep only points where price differs from the previous point */
  function toPriceChangeRows(points: PriceHistoryPoint[]): ChartRow[] {
    const all: ChartRow[] = points.map((p) => ({
      date: formatChartDate(p.searched_at),
      price: p.min_price,
      rawDate: p.searched_at,
      currency: p.currency,
      offerCount: p.offer_count,
    }));
    return all.filter((row, i, arr) => {
      if (i === 0) return true;
      return Math.round(row.price * 100) !== Math.round(arr[i - 1].price * 100);
    });
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

  function VerticalTick(props: Record<string, unknown>) {
    const x = props.x as number;
    const y = props.y as number;
    const payload = props.payload as { value: string };
    return (
      <text
        x={x}
        y={y + 4}
        textAnchor="end"
        fill="#94a3b8"
        fontSize={9}
        transform={`rotate(-90, ${x}, ${y + 4})`}
      >
        {payload.value}
      </text>
    );
  }

  /**
   * Each dot in the filtered data is guaranteed to be a price change point.
   * We always show the price label.
   * Labels render at cy-14; Y domain is padded 25% above max so the highest
   * dot is never at the very top edge of the clip rect.
   */
  function makeDotRenderer(rows: ChartRow[]) {
    return function DotRenderer(props: Record<string, unknown>) {
      const cx      = props.cx as number | undefined;
      const cy      = props.cy as number | undefined;
      const index   = props.index as number | undefined;
      const payload = props.payload as ChartRow | undefined;

      if (cx == null || cy == null || index == null || !payload) return <g />;

      const prevPrice = index > 0 ? rows[index - 1]?.price : undefined;
      const isFirst   = index === 0;
      const isDown    = !isFirst && prevPrice !== undefined && payload.price < prevPrice;
      const color     = isFirst ? "#64748b" : isDown ? "#10b981" : "#ef4444";

      return (
        <g>
          <circle cx={cx} cy={cy} r={3.5} fill="white" stroke="#3b82f6" strokeWidth={1.5} />
          <text
            x={cx}
            y={cy - 10}
            textAnchor="middle"
            fontSize={8}
            fontWeight={700}
            fill={color}
          >
            {payload.currency}{payload.price.toFixed(0)}
          </text>
        </g>
      );
    };
  }

  export function PriceHistoryChart() {
    const { data: flights } = useFlights();
    const [selectedId, setSelectedId] = useState<number>(1);
    const { data: history, isLoading } = usePriceHistory(selectedId);

    const points  = history?.points ?? [];
    const rows    = toPriceChangeRows(points);
    const hasData = rows.length > 0;

    const first   = rows[0]?.price;
    const last    = rows[rows.length - 1]?.price;
    const dropped = hasData && first !== undefined && last !== undefined && last < first;
    const diff    = hasData && first !== undefined && last !== undefined ? first - last : 0;
    const currency = rows[0]?.currency ?? null;

    // Y domain: 10% below min, 28% above max — ensures even the top dot has room for its label
    const prices   = rows.map((r) => r.price);
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 0;
    const range    = maxPrice - minPrice || maxPrice * 0.1 || 1;
    const yMin     = Math.max(0, Math.floor(minPrice - range * 0.1));
    const yMax     = Math.ceil(maxPrice + range * 0.28);

    const DotRenderer = makeDotRenderer(rows);

    // Total checks before filtering (for the footer count)
    const totalChecks = history?.points?.length ?? 0;

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Price History</h2>
            <p className="text-xs text-gray-400 mt-0.5">Points shown only when price changed</p>
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

            <ResponsiveContainer width="100%" height={230}>
              <LineChart data={rows} margin={{ top: 28, right: 10, bottom: 68, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={VerticalTick}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  height={70}
                />
                <YAxis
                  domain={[yMin, yMax]}
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                  tickFormatter={(v: number) =>
                    currency ? `${currency} ${v.toFixed(0)}` : String(v)
                  }
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={DotRenderer}
                  activeDot={{ r: 5, fill: "#3b82f6" }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>

            <p className="text-xs text-gray-400 mt-1 text-right">
              {rows.length} price change{rows.length !== 1 ? "s" : ""} · {totalChecks} total checks
            </p>
          </>
        )}
      </div>
    );
  }
  