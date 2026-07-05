"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, RefreshCw, Loader2, Bell, Search, TrendingDown, Trash2, AlertTriangle } from "lucide-react";
import type { WatchlistItem } from "@/lib/types";
import { useCheckFlight, useDeleteFlight } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/format";

export function WatchlistCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3.5 w-24" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-1">
            <Skeleton className="h-2.5 w-10" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
      <div className="pt-1 border-t border-gray-100 flex gap-2">
        <Skeleton className="h-8 flex-1 rounded-lg" />
        <Skeleton className="h-8 flex-1 rounded-lg" />
      </div>
    </div>
  );
}

interface WatchlistCardProps {
  item: WatchlistItem;
}

export function WatchlistCard({ item }: WatchlistCardProps) {
  const router = useRouter();
  const toast = useToast();
  const checkMutation = useCheckFlight();
  const deleteMutation = useDeleteFlight();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const isChecking =
    checkMutation.isPending && checkMutation.variables === item.flight_id;
  const isDeleting =
    deleteMutation.isPending && deleteMutation.variables === item.flight_id;

  function handleCheck() {
    checkMutation.mutate(item.flight_id, {
      onSuccess: () =>
        toast(
          `Prices refreshed for ${item.origin} → ${item.destination}`,
          "success",
        ),
      onError: () => toast("Price check failed. Please try again.", "error"),
    });
  }

  function handleDeleteClick() {
    setConfirmingDelete(true);
  }

  function handleDeleteCancel() {
    setConfirmingDelete(false);
  }

  function handleDeleteConfirm() {
    deleteMutation.mutate(item.flight_id, {
      onSuccess: () => {
        setConfirmingDelete(false);
        toast(
          `${item.origin} → ${item.destination} removed from tracking.`,
          "success",
        );
      },
      onError: () => {
        setConfirmingDelete(false);
        toast("Failed to remove flight. Please try again.", "error");
      },
    });
  }

  const hasData = item.current_price !== null;

  return (
    <div
      className={`group bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4 transition-all duration-150 hover:shadow-md hover:-translate-y-px ${
        item.is_active ? "" : "opacity-60"
      }`}
    >
      {/* Header: route + status badge + delete icon */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-gray-900 font-semibold text-base leading-tight">
            <span className="truncate">{item.origin}</span>
            <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
            <span className="truncate">{item.destination}</span>
          </div>
          {item.label && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{item.label}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {formatDate(item.departure_date)}
            {item.return_date && (
              <span className="text-gray-400">
                {" "}→ {formatDate(item.return_date)}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <StatusBadge active={item.is_active} />
          <button
            onClick={handleDeleteClick}
            disabled={isDeleting}
            title="Remove flight"
            className="p-1 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-30"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Inline delete confirmation */}
      {confirmingDelete && (
        <div className="rounded-lg bg-red-50 border border-red-100 p-3 flex flex-col gap-2.5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 font-medium leading-snug">
              Remove this flight from tracking?
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDeleteCancel}
              disabled={isDeleting}
              className="flex-1 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Trash2 className="w-3 h-3" />
              )}
              {isDeleting ? "Removing…" : "Remove"}
            </button>
          </div>
        </div>
      )}

      {/* Current price */}
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">
          Current Price
        </p>
        {hasData ? (
          <p className="text-2xl font-bold text-gray-900 leading-none">
            {formatCurrency(item.current_price, item.currency)}
          </p>
        ) : (
          <p className="text-sm text-gray-400 italic">No data yet</p>
        )}
      </div>

      {/* Price range */}
      {hasData && (
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <p className="text-gray-400 font-medium mb-0.5">Low</p>
            <p className="text-gray-700 font-semibold">
              {formatCurrency(item.lowest_price, item.currency)}
            </p>
          </div>
          <div>
            <p className="text-gray-400 font-medium mb-0.5">High</p>
            <p className="text-gray-700 font-semibold">
              {formatCurrency(item.highest_price, item.currency)}
            </p>
          </div>
          <div>
            <p className="text-gray-400 font-medium mb-0.5">Avg</p>
            <p className="text-gray-700 font-semibold">
              {formatCurrency(item.average_price, item.currency)}
            </p>
          </div>
        </div>
      )}

      {/* Flight preference pills */}
      <div className="flex items-center gap-1.5 flex-wrap -mt-1">
        <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium capitalize">
          {item.cabin_class.replace("_", " ")}
        </span>
        {item.trip_type === "round_trip" && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-medium">
            ↔ Round-trip
          </span>
        )}
        {(item.adults > 1 || item.children > 0 || item.infants > 0) && (
          <span className="text-xs text-gray-400">
            {item.adults + item.children + item.infants} pax
          </span>
        )}
        {item.date_flexibility > 0 && (
          <span className="text-xs text-gray-400">±{item.date_flexibility}d flex</span>
        )}
      </div>

      {/* Activity counts */}
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Search className="w-3 h-3" />
          {item.total_searches} search{item.total_searches !== 1 ? "es" : ""}
        </span>
        <span className="text-gray-300">·</span>
        <span className="flex items-center gap-1">
          <TrendingDown className="w-3 h-3" />
          {item.total_offers_seen} offer{item.total_offers_seen !== 1 ? "s" : ""}
        </span>
        <span className="text-gray-300">·</span>
        <span className="flex items-center gap-1">
          <Bell className="w-3 h-3" />
          {item.notifications_sent}
        </span>
      </div>

      {/* Last checked */}
      <p className="text-xs text-gray-400 -mt-2">
        Last checked: {formatRelativeTime(item.last_checked_at)}
      </p>

      {/* Actions */}
      <div className="pt-1 border-t border-gray-100 flex gap-2">
        <button
          onClick={handleCheck}
          disabled={isChecking || isDeleting}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isChecking ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          {isChecking ? "Checking…" : "Check Now"}
        </button>
        <button
          onClick={() => router.push(`/dashboard/flights/${item.flight_id}`)}
          disabled={isDeleting}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors disabled:opacity-50"
        >
          View Details
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
