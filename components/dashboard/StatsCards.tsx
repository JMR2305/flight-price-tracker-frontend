"use client";

import {
  Plane, PauseCircle, PlayCircle, DollarSign,
  TrendingDown, Search, Package, Bell,
} from "lucide-react";
import { useWatchlist } from "@/lib/api";
import { StatCard } from "@/components/ui/StatCard";
import { StatCardSkeleton } from "@/components/ui/Skeleton";
import { formatCurrency, formatNumber } from "@/lib/format";

export function StatsCards() {
  const { data: items, isLoading } = useWatchlist();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const flights = items ?? [];
  const active = flights.filter((f) => f.is_active);
  const paused = flights.filter((f) => !f.is_active);

  const prices = flights
    .map((f) => f.current_price)
    .filter((p): p is number => p !== null);

  const cheapest = prices.length ? Math.min(...prices) : null;
  const average = prices.length
    ? prices.reduce((s, p) => s + p, 0) / prices.length
    : null;

  const currency = flights.find((f) => f.currency)?.currency ?? null;

  const totalSearches = flights.reduce((s, f) => s + f.total_searches, 0);
  const totalOffers = flights.reduce((s, f) => s + f.total_offers_seen, 0);
  const totalNotifs = flights.reduce((s, f) => s + f.notifications_sent, 0);

  const cards = [
    {
      title: "Flights Tracked",
      value: formatNumber(flights.length),
      subtitle: "all routes in watchlist",
      icon: <Plane className="w-4 h-4" />,
      iconBg: "bg-brand-50 text-brand-600",
    },
    {
      title: "Active",
      value: formatNumber(active.length),
      subtitle: "currently monitoring",
      icon: <PlayCircle className="w-4 h-4" />,
      iconBg: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Paused",
      value: formatNumber(paused.length),
      subtitle: "monitoring stopped",
      icon: <PauseCircle className="w-4 h-4" />,
      iconBg: "bg-gray-100 text-gray-500",
    },
    {
      title: "Notifications",
      value: formatNumber(totalNotifs),
      subtitle: "price-drop alerts sent",
      icon: <Bell className="w-4 h-4" />,
      iconBg: "bg-amber-50 text-amber-600",
    },
    {
      title: "Cheapest Fare",
      value: formatCurrency(cheapest, currency),
      subtitle: "lowest current price",
      icon: <TrendingDown className="w-4 h-4" />,
      iconBg: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Average Fare",
      value: formatCurrency(average !== null ? Math.round(average * 100) / 100 : null, currency),
      subtitle: "across all routes",
      icon: <DollarSign className="w-4 h-4" />,
      iconBg: "bg-violet-50 text-violet-600",
    },
    {
      title: "Total Searches",
      value: formatNumber(totalSearches),
      subtitle: "price check runs",
      icon: <Search className="w-4 h-4" />,
      iconBg: "bg-sky-50 text-sky-600",
    },
    {
      title: "Total Offers",
      value: formatNumber(totalOffers),
      subtitle: "fares seen across all searches",
      icon: <Package className="w-4 h-4" />,
      iconBg: "bg-rose-50 text-rose-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {cards.map((card) => (
        <StatCard key={card.title} {...card} />
      ))}
    </div>
  );
}
