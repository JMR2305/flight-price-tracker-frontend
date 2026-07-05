"use client";

import { useState, useMemo } from "react";
import { AlertCircle, Plane, SlidersHorizontal } from "lucide-react";
import { useWatchlist } from "@/lib/api";
import { EmptyState } from "@/components/ui/EmptyState";
import { WatchlistCard, WatchlistCardSkeleton } from "./WatchlistCard";
import type { WatchlistItem } from "@/lib/types";

type FilterKey = "all" | "active" | "paused" | "economy" | "business" | "first" | "round_trip" | "one_way";
type SortKey = "default" | "cheapest" | "highest" | "departure" | "last_checked" | "notifications";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "paused", label: "Paused" },
  { key: "economy", label: "Economy" },
  { key: "business", label: "Business" },
  { key: "first", label: "First" },
  { key: "round_trip", label: "Round-trip" },
  { key: "one_way", label: "One-way" },
];

function applyFilter(items: WatchlistItem[], filter: FilterKey): WatchlistItem[] {
  switch (filter) {
    case "active": return items.filter((i) => i.is_active);
    case "paused": return items.filter((i) => !i.is_active);
    case "economy": return items.filter((i) => i.cabin_class === "economy" || i.cabin_class === "premium_economy");
    case "business": return items.filter((i) => i.cabin_class === "business");
    case "first": return items.filter((i) => i.cabin_class === "first");
    case "round_trip": return items.filter((i) => i.trip_type === "round_trip");
    case "one_way": return items.filter((i) => i.trip_type === "one_way");
    default: return items;
  }
}

function applySort(items: WatchlistItem[], sort: SortKey): WatchlistItem[] {
  const arr = [...items];
  switch (sort) {
    case "cheapest":
      return arr.sort((a, b) => (a.current_price ?? Infinity) - (b.current_price ?? Infinity));
    case "highest":
      return arr.sort((a, b) => (b.current_price ?? -Infinity) - (a.current_price ?? -Infinity));
    case "departure":
      return arr.sort((a, b) => a.departure_date.localeCompare(b.departure_date));
    case "last_checked":
      return arr.sort((a, b) => {
        const ta = a.last_checked_at ? new Date(a.last_checked_at).getTime() : 0;
        const tb = b.last_checked_at ? new Date(b.last_checked_at).getTime() : 0;
        return tb - ta;
      });
    case "notifications":
      return arr.sort((a, b) => b.notifications_sent - a.notifications_sent);
    default:
      return arr;
  }
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="col-span-full">
      <EmptyState
        icon={<AlertCircle className="w-6 h-6 text-red-400" />}
        title="Failed to load watchlist"
        description="Check that the backend is running and try again."
        action={
          <button
            onClick={onRetry}
            className="text-xs font-medium px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Retry
          </button>
        }
      />
    </div>
  );
}

export function WatchlistGrid() {
  const { data: items, isLoading, isError, refetch } = useWatchlist();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("default");

  const displayed = useMemo(() => {
    if (!items) return [];
    return applySort(applyFilter(items, filter), sort);
  }, [items, filter, sort]);

  return (
    <section>
      <div className="flex items-start justify-between mb-3 gap-2 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Tracked Flights</h2>
          {!isLoading && !isError && items && (
            <p className="text-xs text-gray-400 mt-0.5">
              {displayed.length} of {items.length} flight{items.length !== 1 ? "s" : ""} ·{" "}
              {items.filter((i) => i.is_active).length} monitoring
            </p>
          )}
        </div>
        {!isLoading && !isError && (items?.length ?? 0) > 0 && (
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="default">Default order</option>
              <option value="cheapest">Cheapest first</option>
              <option value="highest">Most expensive</option>
              <option value="departure">By departure</option>
              <option value="last_checked">Recently checked</option>
              <option value="notifications">Most alerts</option>
            </select>
          </div>
        )}
      </div>

      {/* Filter chips */}
      {!isLoading && !isError && (items?.length ?? 0) > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-4">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
                filter === f.key
                  ? "bg-brand-600 text-white border-brand-600"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <WatchlistCardSkeleton key={i} />
          ))}

        {isError && <ErrorState onRetry={refetch} />}

        {!isLoading && !isError && items?.length === 0 && (
          <div className="col-span-full">
            <EmptyState
              icon={<Plane className="w-6 h-6" />}
              title="No flights tracked yet"
              description="Add your first flight using the button above to start monitoring prices."
            />
          </div>
        )}

        {!isLoading && !isError && displayed.length === 0 && (items?.length ?? 0) > 0 && (
          <div className="col-span-full">
            <EmptyState
              icon={<Plane className="w-6 h-6" />}
              title="No flights match this filter"
              description="Try a different filter or clear the selection."
              action={
                <button
                  onClick={() => setFilter("all")}
                  className="text-xs font-medium px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Clear filter
                </button>
              }
            />
          </div>
        )}

        {!isLoading &&
          !isError &&
          displayed.map((item) => (
            <WatchlistCard key={item.flight_id} item={item} />
          ))}
      </div>
    </section>
  );
}
