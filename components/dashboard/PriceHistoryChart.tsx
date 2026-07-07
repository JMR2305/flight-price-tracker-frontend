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
    Customized,
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

  /** Keep only points where the price changed from the previous record */
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

  /** Vertical tick for XAxis — avoids TypeScript issues with angle in tick object */
  function VerticalTick(props: Record<string, unknown>) {
    const x = props.x as number;
    const y = props.y as number;
    const payload = props.payload as { value: string };
    return (
      <text x={x} y={y + 4} textAnchor="end" fill="#94a3b8" fontSize={9}
        transform={`rotate(-90, ${x}, ${y + 4})`}>
        {payload.value}
      </text>
    );
  }

  /**
   * Renders price labels using Recharts <Customized />.
   * This component renders in the ROOT svg layer — completely outside the
   * clip-path that normally hides text drawn above/near the chart boundary.
   */
  function PriceLabels(props: Record<string, unknown>) {
    // Recharts injects formattedGraphicalItems with pixel positions for each data point
    const items = props.formattedGraphicalItems as
      | Array<{ props: { points: Array<{ x: number; y: number; payload: ChartRow }> } }>
      | undefined;

    const points = items?.[0]?.props?.points;
    if (!points?.length) return null;

    return (
      <g>
        {points.map((pt, i) => {
          const prevPt = points[i - 1];
          const isFirst = i === 0;
          const isDown = !isFirst && prevPt && pt.payload.price < prevPt.payload.price;
          const color = isFirst ? "#64748b" : isDown ? "#10b981" : "#ef4444";

          return (
            <text
              key={i}
              x={pt.x}
              y={pt.y - 10}
              textAnchor="middle"
              fontSize={8}
              fontWeight={700}
              fill={color}
              style={{ pointerEvents: "none" }}
            >
              {pt.payload.currency}{pt.payload.price.toFixed(0)}
            </text>
          );
        })}
      </g>
    );
  }

  export function PriceHistoryChart() {
    const { data: flights } = useFlights();
    const [selectedId, setSelectedId] = useState<number>(1);
    const { data: history, isLoading } = usePriceHistory(selectedId);

    const allPoints  = history?.points ?? [];
    const rows       = toPriceChangeRows(allPoints);
    const hasData    = rows.length > 0;

    const first    = rows[0]?.price;
    const last     = rows[rows.length - 1]?.price;
    const dropped  = hasData && first !== undefined && last !== undefined && last < first;
    const diff     = hasData && first !== undefined && last !== undefined ? first - last : 0;
    const currency = rows[0]?.currency ?? null;

    // Y domain: 10% below min, 25% above max so labels never hit the top clip boundary
    const prices   = rows.map((r) => r.price);
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 0;
    const range    = maxPrice - minPrice || maxPrice * 0.1 || 1;
    const yMin     = Math.max(0, Math.floor(minPrice - range * 0.1));
    const yMax     = Math.ceil(maxPrice + range * 0.25);

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Price History</h2>
            <p className="text-xs text-gray-400 mt-0.5">Only price-change points shown</p>
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
              <LineChart data={rows} margin={{ top: 30, right: 12, bottom: 70, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={VerticalTick}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  height={72}
                />
                <YAxis
                  domain={[yMin, yMax]}
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  width={54}
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
                  dot={{ r: 3.5, fill: "white", stroke: "#3b82f6", strokeWidth: 1.5 }}
                  activeDot={{ r: 5, fill: "#3b82f6" }}
                  isAnimationActive={false}
                />
                {/* Renders price labels in the root SVG layer, outside the clip-path */}
                <Customized component={PriceLabels} />
              </LineChart>
            </ResponsiveContainer>

            <p className="text-xs text-gray-400 mt-1 text-right">
              {rows.length} price change{rows.length !== 1 ? "s" : ""} · {allPoints.length} total checks
            </p>
          </>
        )}
      </div>
    );
  }
  