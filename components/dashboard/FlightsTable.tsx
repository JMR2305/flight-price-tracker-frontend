"use client";

import { useState } from "react";
import {
  RefreshCw, Trash2, ArrowRight, Loader2, Pencil,
  ToggleLeft, ToggleRight,
} from "lucide-react";
import {
  useFlights, useCheckFlight, useDeleteFlight,
  useUpdateFlight, mockLastCheckedPrices, mockLastChecked,
} from "@/lib/api";
import type { Flight } from "@/lib/types";
import { AddFlightModal } from "./AddFlightModal";
import { EditFlightModal } from "./EditFlightModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
  import { useUSDToINR } from "@/lib/use-exchange-rate";
  import { formatINR } from "@/lib/format";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function timeAgo(iso: string) {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (h < 1) return "< 1h ago";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function SkeletonRow() {
  return (
    <tr>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-100 rounded animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

export function FlightsTable() {
  const toast = useToast();
    const inrRate = useUSDToINR();
  const [addOpen, setAddOpen] = useState(false);
  const [editFlight, setEditFlight] = useState<Flight | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Flight | null>(null);

  const { data: flights, isLoading, isError } = useFlights();
  const checkMutation = useCheckFlight();
  const deleteMutation = useDeleteFlight();
  const updateMutation = useUpdateFlight();

  function handleCheck(flight: Flight) {
    checkMutation.mutate(flight.id, {
      onSuccess: () => toast(`Prices checked for ${flight.origin} → ${flight.destination}`, "success"),
      onError: () => toast("Price check failed. Try again.", "error"),
    });
  }

  function handleToggle(flight: Flight) {
    const next = !flight.is_active;
    updateMutation.mutate(
      { id: flight.id, data: { is_active: next } },
      {
        onSuccess: () =>
          toast(
            `${flight.origin} → ${flight.destination} ${next ? "enabled" : "paused"}`,
            next ? "success" : "info",
          ),
        onError: () => toast("Failed to update flight status.", "error"),
      },
    );
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    deleteMutation.mutate(target.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        toast(`${target.origin} → ${target.destination} removed`, "info");
      },
      onError: () => toast("Failed to delete flight.", "error"),
    });
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Tracked Flights</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isLoading ? "Loading…" : isError ? "Could not load flights" : `${flights?.length ?? 0} routes monitored`}
            </p>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="text-xs font-medium text-brand-600 hover:text-brand-700 px-3 py-1.5 rounded-lg border border-brand-200 hover:bg-brand-50 transition-colors"
          >
            + Add flight
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                {["Route", "Departure", "Label", "Lowest Price", "Last Checked", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-red-400 text-sm">
                    Failed to load flights. Is the backend running?
                  </td>
                </tr>
              ) : flights?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">
                    No flights tracked yet.{" "}
                    <button onClick={() => setAddOpen(true)} className="text-brand-600 hover:underline">
                      Add your first route
                    </button>.
                  </td>
                </tr>
              ) : (
                flights?.map((flight) => {
                  const isChecking = checkMutation.isPending && checkMutation.variables === flight.id;
                  const isTogglingThis = updateMutation.isPending && updateMutation.variables?.id === flight.id && "is_active" in (updateMutation.variables?.data ?? {});
                  const price = mockLastCheckedPrices[flight.id];
                  const lastChecked = mockLastChecked[flight.id];

                  return (
                    <tr
                      key={flight.id}
                      className={`hover:bg-gray-50 transition-colors ${!flight.is_active ? "opacity-50" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 font-medium text-gray-900">
                          <span>{flight.origin}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                          <span>{flight.destination}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(flight.departure_date)}</td>
                      <td className="px-4 py-3">
                        {flight.label ? (
                          <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{flight.label}</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {price != null ? (
                          <span className="font-semibold text-emerald-600">${price.toFixed(2)}</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {lastChecked ? timeAgo(lastChecked) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleCheck(flight)}
                            disabled={isChecking || !flight.is_active}
                            title="Check prices now"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 disabled:opacity-40 transition-colors"
                          >
                            {isChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => setEditFlight(flight)}
                            title="Edit flight"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggle(flight)}
                            disabled={isTogglingThis}
                            title={flight.is_active ? "Pause tracking" : "Resume tracking"}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 disabled:opacity-40 transition-colors"
                          >
                            {isTogglingThis ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : flight.is_active ? (
                              <ToggleRight className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <ToggleLeft className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => setDeleteTarget(flight)}
                            title="Delete flight"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddFlightModal open={addOpen} onClose={() => setAddOpen(false)} />
      <EditFlightModal flight={editFlight} onClose={() => setEditFlight(null)} />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete flight"
        message={
          deleteTarget
            ? `Remove ${deleteTarget.origin} → ${deleteTarget.destination} and all its price history? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
