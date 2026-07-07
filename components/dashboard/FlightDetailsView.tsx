"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, RefreshCw, Loader2, AlertCircle,
  Bell, Search, TrendingDown, TrendingUp, Plane, CheckCircle,
  XCircle, Clock,
} from "lucide-react";
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
import { useFlightDetails, useCheckFlight } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ChartSkeleton, TableSkeleton, TimelineSkeleton, Skeleton } from "@/components/ui/Skeleton";
import {
  formatCurrency, formatDate, formatDateTime,
  formatRelativeTime, formatDuration, formatChartDate,
  formatINR,
} from "@/lib/format";
import { useUSDToINR } from "@/lib/use-exchange-rate";
import type { FlightDetails, FlightOffer, NotificationRecord, PriceHistoryPoint } from "@/lib/types";

// ── Chart helpers ─────────────────────────────────────────────────────────────

interface ChartRow {
  date: string;
  price: number;
  currency: string;
  offerCount: number;
}

/** Only keep points where price changed from the previous record */
function toPriceChangeRows(allPoints: PriceHistoryPoint[]): ChartRow[] {
  const all: ChartRow[] = allPoints.map((p) => ({
    date: formatChartDate(p.searched_at),
    price: p.min_price,
    currency: p.currency,
    offerCount: p.offer_count,
  }));
  return all.filter((row, i, arr) => {
    if (i === 0) return true;
    return Math.round(row.price * 100) !== Math.round(arr[i - 1].price * 100);
  });
}

/** Vertical tick for XAxis — avoids TS issues with angle inside tick object */
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

/** Labels rendered in the root SVG layer (outside Recharts clip-path) */
function PriceLabels(props: Record<string, unknown>) {
  const items = props.formattedGraphicalItems as
    | Array<{ props: { points: Array<{ x: number; y: number; payload: ChartRow }> } }>
    | undefined;
  const pts = items?.[0]?.props?.points;
  if (!pts?.length) return null;
  return (
    <g>
      {pts.map((pt, i) => {
        const prev = pts[i - 1];
        const isFirst = i === 0;
        const isDown = !isFirst && prev && pt.payload.price < prev.payload.price;
        const color = isFirst ? "#64748b" : isDown ? "#10b981" : "#ef4444";
        return (
          <text key={i} x={pt.x} y={pt.y - 10} textAnchor="middle"
            fontSize={8} fontWeight={700} fill={color} style={{ pointerEvents: "none" }}>
            {pt.payload.currency}{pt.payload.price.toFixed(0)}
          </text>
        );
      })}
    </g>
  );
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

// ── Price chart ───────────────────────────────────────────────────────────────

function PriceChart({ points, currency }: { points: PriceHistoryPoint[]; currency: string | null }) {
  const rows = toPriceChangeRows(points);

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<TrendingDown className="w-6 h-6" />}
        title="No price history yet"
        description="Run a price check to start tracking"
      />
    );
  }

  const first = rows[0].price;
  const last = rows[rows.length - 1].price;
  const dropped = last < first;
  const diff = Math.abs(first - last);

  const yMin = 0;
  const yMax = 500;

  return (
    <div>
      <div className="flex items-baseline gap-3 mb-5">
        <span className="text-2xl font-bold text-gray-900">
          {formatCurrency(last, currency)}
        </span>
        <INRBadge usd={last} />
        {diff > 0.01 && (
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
            {formatCurrency(diff, currency)} since first check
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={230}>
        <LineChart data={rows} margin={{ top: 28, right: 12, bottom: 70, left: 0 }}>
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
          <Customized component={PriceLabels} />
        </LineChart>
      </ResponsiveContainer>

      <p className="text-xs text-gray-400 mt-1 text-right">
        {rows.length} price change{rows.length !== 1 ? "s" : ""} · {points.length} total checks
      </p>
    </div>
  );
}

// ── Latest offers table ───────────────────────────────────────────────────────

function OffersTable({ offers }: { offers: FlightOffer[] }) {
  if (offers.length === 0) {
    return (
      <EmptyState
        icon={<Plane className="w-6 h-6" />}
        title="No offers yet"
        description="Run a price check to see available fares"
      />
    );
  }

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-xs min-w-[400px]">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left font-medium text-gray-400 pb-2 pl-1">Airline</th>
            <th className="text-right font-medium text-gray-400 pb-2">Price</th>
            <th className="text-right font-medium text-gray-400 pb-2">Departure</th>
            <th className="text-right font-medium text-gray-400 pb-2">Duration</th>
            <th className="text-right font-medium text-gray-400 pb-2 pr-1">Stops</th>
          </tr>
        </thead>
        <tbody>
          {offers.map((offer, i) => (
            <tr
              key={offer.id}
              className={`border-b border-gray-50 transition-colors hover:bg-gray-50/60 ${
                i === 0 ? "bg-emerald-50/40" : ""
              }`}
            >
              <td className="py-2.5 pl-1">
                <div className="flex items-center gap-2">
                  {offer.airline_logo_url ? (
                    <img
                      src={offer.airline_logo_url}
                      alt={offer.airline}
                      className="h-5 w-auto max-w-[48px] object-contain flex-shrink-0"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded bg-gray-100 text-gray-400 text-[9px] font-bold flex-shrink-0">
                      {offer.airline.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <span className="font-medium text-gray-700">{offer.airline}</span>
                  {i === 0 && (
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                      Cheapest
                    </span>
                  )}
                </div>
              </td>
              <td className="py-2.5 text-right">
                <span className="font-semibold text-gray-900 block">{formatCurrency(offer.price, offer.currency)}</span>
                <INRBadge usd={offer.price} className="justify-end" />
              </td>
              <td className="py-2.5 text-right text-gray-500">
                {new Date(offer.departure_time).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
              <td className="py-2.5 text-right text-gray-500">
                {formatDuration(offer.duration_minutes)}
              </td>
              <td className="py-2.5 text-right pr-1 text-gray-500">
                {offer.stops === 0
                  ? "Direct"
                  : `${offer.stops} stop${offer.stops > 1 ? "s" : ""}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Notification timeline ─────────────────────────────────────────────────────

const CHANNEL_EMOJI: Record<string, string> = {
  telegram: "✈",
  whatsapp: "💬",
  email: "✉",
  sms: "📱",
  webhook: "🔗",
};

function NotificationTimeline({ notifications }: { notifications: NotificationRecord[] }) {
  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={<Bell className="w-6 h-6" />}
        title="No notifications yet"
        description="Price-drop alerts will appear here"
      />
    );
  }

  return (
    <ul className="space-y-3">
      {notifications.map((n) => {
        const sent = n.status === "sent";
        return (
          <li key={n.id} className="flex items-start gap-3">
            <div
              className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                sent
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-red-50 text-red-500"
              }`}
            >
              {sent ? (
                <CheckCircle className="w-3.5 h-3.5" />
              ) : (
                <XCircle className="w-3.5 h-3.5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-gray-700 capitalize">
                  {CHANNEL_EMOJI[n.channel] ?? "🔔"} {n.channel}
                </span>
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                    sent
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {n.status}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3 flex-shrink-0" />
                {formatRelativeTime(n.sent_at ?? n.created_at)}
                <span className="text-gray-300">·</span>
                {formatDateTime(n.sent_at ?? n.created_at)}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// ── Page skeleton ─────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-20 rounded-lg" />
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <Skeleton className="h-4 w-28 mb-1" />
        <Skeleton className="h-3 w-40 mb-5" />
        <ChartSkeleton />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <Skeleton className="h-4 w-28 mb-4" />
          <TableSkeleton rows={4} />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <Skeleton className="h-4 w-36 mb-4" />
          <TimelineSkeleton rows={3} />
        </div>
      </div>
    </div>
  );
}

// ── INR badge helper ────────────────────────────────────────────────────────

function INRBadge({ usd, className = "" }: { usd: number | null; className?: string }) {
    const inrRate = useUSDToINR();
    if (usd == null) return null;
    return (
      <span className={`flex items-center gap-0.5 text-[10px] text-gray-400 mt-0.5 ${className}`}>
        ≈ {formatINR(usd, inrRate)}
      </span>
    );
}

// ── Main view ─────────────────────────────────────────────────────────────────

export function FlightDetailsView({ flightId }: { flightId: number }) {
  const router = useRouter();
  const toast = useToast();
  const { data, isLoading, isError, refetch } = useFlightDetails(flightId);
  const checkMutation = useCheckFlight();

  if (isLoading) return <PageSkeleton />;

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
          <AlertCircle className="w-6 h-6 text-red-400" />
        </div>
        <p className="text-sm font-medium text-gray-700">Failed to load flight details</p>
        <p className="text-xs text-gray-400 mt-1 mb-4">
          Flight #{flightId} may not exist or the backend is unreachable.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-xs font-medium px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            ← Back to Dashboard
          </button>
          <button
            onClick={() => refetch()}
            className="text-xs font-medium px-4 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { flight, stats, price_history, latest_offers, notifications, latest_search } =
    data as FlightDetails;
  const isChecking =
    checkMutation.isPending && checkMutation.variables === flightId;

  function handleCheck() {
    checkMutation.mutate(flightId, {
      onSuccess: () => {
        toast(
          `Prices refreshed for ${flight.origin} → ${flight.destination}`,
          "success",
        );
        refetch();
      },
      onError: () => toast("Price check failed. Please try again.", "error"),
    });
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-0.5 flex-shrink-0 flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-1.5">
                {flight.origin}
                <ArrowRight className="w-4 h-4 text-gray-400" />
                {flight.destination}
              </h1>
              <StatusBadge active={flight.is_active} />
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {formatDate(flight.departure_date)}
              {flight.return_date && (
                <span className="text-gray-400">
                  {" "}→ {formatDate(flight.return_date)}
                </span>
              )}
              {flight.label && (
                <span className="text-gray-400"> · {flight.label}</span>
              )}
            </p>
            {latest_search && (
              <p className="text-xs text-gray-400 mt-0.5">
                Last checked {formatRelativeTime(latest_search.searched_at)} via{" "}
                {latest_search.provider}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleCheck}
          disabled={isChecking}
          className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isChecking ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Checking…
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Check Now
            </>
          )}
        </button>
      </div>

      {/* ── Stats cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Current Price"
          value={formatCurrency(stats.current_price, stats.currency)}
          subtitle={
            stats.last_checked_at
              ? `Updated ${formatRelativeTime(stats.last_checked_at)}`
              : "Not yet checked"
          }
          icon={<TrendingDown className="w-4 h-4" />}
          iconBg="bg-brand-50 text-brand-600"
        />
        <StatCard
          title="Lowest Ever"
          value={formatCurrency(stats.lowest_price, stats.currency)}
          subtitle={
            stats.highest_price !== null
              ? `High: ${formatCurrency(stats.highest_price, stats.currency)}`
              : undefined
          }
          icon={<TrendingDown className="w-4 h-4" />}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Total Searches"
          value={String(stats.total_searches)}
          subtitle={`${stats.total_offers_seen} offers seen`}
          icon={<Search className="w-4 h-4" />}
          iconBg="bg-violet-50 text-violet-600"
        />
        <StatCard
          title="Notifications"
          value={String(stats.notifications_sent)}
          subtitle="price-drop alerts sent"
          icon={<Bell className="w-4 h-4" />}
          iconBg="bg-amber-50 text-amber-600"
        />
      </div>

      {/* ── Price history chart ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-0.5">Price History</h2>
        <p className="text-xs text-gray-400 mb-5">Only price-change points shown</p>
        <PriceChart points={price_history} currency={stats.currency} />
      </div>

      {/* ── Offers + Notifications ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Latest Offers</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {latest_search
                  ? `From search on ${formatDate(latest_search.searched_at)} · sorted by price`
                  : "No search run yet"}
              </p>
            </div>
            {latest_search && (
              <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                {latest_search.offer_count} offers
              </span>
            )}
          </div>
          <OffersTable offers={latest_offers} />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Notification History
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">Price-drop alerts sent</p>
            </div>
            <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
              {notifications.length} total
            </span>
          </div>
          <NotificationTimeline notifications={notifications} />
        </div>
      </div>
    </div>
  );
}
