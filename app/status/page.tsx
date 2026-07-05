"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { useSystemStatus, useCheckAll } from "@/lib/system-api";
import { useToast } from "@/components/ui/Toast";
import {
  CheckCircle, XCircle, Clock, Database, Cpu,
  Play, Loader2, RefreshCw, Zap,
} from "lucide-react";
import type { CheckAllSummary } from "@/lib/system-api";
import { useState } from "react";

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
        ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
      }`}
    >
      {ok ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
      {label}
    </span>
  );
}

function StatRow({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-medium text-gray-900 ${mono ? "font-mono" : ""}`}>
        {value ?? <span className="text-gray-300">—</span>}
      </span>
    </div>
  );
}

function formatTs(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function CheckAllResults({ summary }: { summary: CheckAllSummary }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Last Check-All Results</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Checked", value: summary.flights_checked, color: "text-gray-900" },
          { label: "Offers stored", value: summary.offers_stored, color: "text-brand-600" },
          { label: "Notifications", value: summary.notifications_sent, color: "text-emerald-600" },
          { label: "Failures", value: summary.failures, color: summary.failures > 0 ? "text-red-500" : "text-gray-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 mb-3">Completed in {summary.duration_seconds.toFixed(3)}s</p>
      {summary.results.length > 0 && (
        <div className="divide-y divide-gray-100">
          {summary.results.map((r) => (
            <div key={r.flight_id} className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2">
                {r.status === "ok"
                  ? <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  : <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                <span className="text-sm text-gray-700 font-medium">
                  {r.origin} → {r.destination}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                {r.status === "ok" ? (
                  <>
                    <span>{r.offers_found} offer{r.offers_found !== 1 ? "s" : ""}</span>
                    {r.notification_sent && (
                      <span className="text-emerald-600 font-medium">↓ price drop</span>
                    )}
                  </>
                ) : (
                  <span className="text-red-500">{r.error}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StatusPage() {
  const toast = useToast();
  const { data: status, isLoading, refetch, isRefetching } = useSystemStatus();
  const checkAll = useCheckAll();
  const [lastSummary, setLastSummary] = useState<CheckAllSummary | null>(null);

  function handleCheckAll() {
    checkAll.mutate(undefined, {
      onSuccess: (data) => {
        setLastSummary(data);
        toast(
          `Checked ${data.flights_checked} flight${data.flights_checked !== 1 ? "s" : ""} — ${data.offers_stored} offers stored`,
          "success",
        );
      },
      onError: (err) =>
        toast((err as Error).message ?? "Check-all failed", "error"),
    });
  }

  const isHealthy = status?.status === "healthy";
  const dbOk = status?.database === "connected";
  const schedulerRunning = status?.scheduler?.running ?? false;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav />
        <main className="flex-1 px-4 md:px-6 py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">System Status</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Backend health, scheduler, and provider info. Refreshes every 30s.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => refetch()}
                disabled={isRefetching || isLoading}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <button
                onClick={handleCheckAll}
                disabled={checkAll.isPending}
                className="flex items-center gap-1.5 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 px-3 py-1.5 rounded-lg disabled:opacity-60 transition-colors"
              >
                {checkAll.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5" />
                )}
                {checkAll.isPending ? "Running…" : "Check all now"}
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-24 text-gray-300">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-gray-400" />
                    <h2 className="text-sm font-semibold text-gray-900">Backend</h2>
                  </div>
                  <StatusBadge ok={isHealthy} label={status?.status ?? "unknown"} />
                </div>
                <StatRow label="API status" value={<StatusBadge ok={isHealthy} label={isHealthy ? "Healthy" : "Degraded"} />} />
                <StatRow label="Provider" value={
                  <span className="px-2 py-0.5 bg-violet-50 text-violet-700 rounded text-xs font-medium">
                    {status?.provider ?? "—"}
                  </span>
                } />
                <StatRow label="Active flights" value={status?.active_flights ?? 0} />
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-4 h-4 text-gray-400" />
                  <h2 className="text-sm font-semibold text-gray-900">Database</h2>
                </div>
                <StatRow label="Connection" value={<StatusBadge ok={dbOk} label={status?.database ?? "unknown"} />} />
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5 lg:col-span-2">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <h2 className="text-sm font-semibold text-gray-900">Scheduler</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                  <div>
                    <StatRow label="Status" value={<StatusBadge ok={schedulerRunning} label={schedulerRunning ? "Running" : "Stopped"} />} />
                    <StatRow label="Interval" value={`Every ${status?.scheduler?.interval_hours ?? 1}h`} />
                  </div>
                  <div>
                    <StatRow label="Last run" value={formatTs(status?.scheduler?.last_run_at ?? null)} mono />
                    <StatRow label="Next run" value={formatTs(status?.scheduler?.next_run_at ?? null)} mono />
                  </div>
                </div>
              </div>
            </div>
          )}

          {lastSummary && <CheckAllResults summary={lastSummary} />}
        </main>
      </div>
    </div>
  );
}
