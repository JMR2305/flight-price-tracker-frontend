import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiError } from "./api-client";

export interface SchedulerStatus {
  running: boolean;
  interval_hours: number;
  last_run_at: string | null;
  next_run_at: string | null;
}

export interface SystemStatus {
  status: "healthy" | "degraded";
  database: "connected" | "error";
  scheduler: SchedulerStatus;
  provider: string;
  active_flights: number;
}

export interface FlightCheckResult {
  flight_id: number;
  origin: string;
  destination: string;
  status: "ok" | "error";
  offers_found: number;
  notification_sent: boolean;
  error?: string;
}

export interface CheckAllSummary {
  flights_checked: number;
  offers_stored: number;
  notifications_sent: number;
  failures: number;
  duration_seconds: number;
  results: FlightCheckResult[];
}

const IS_DEV = process.env.NODE_ENV === "development";

const MOCK_STATUS: SystemStatus = {
  status: "healthy",
  database: "connected",
  scheduler: {
    running: false,
    interval_hours: 1,
    last_run_at: null,
    next_run_at: null,
  },
  provider: "mock",
  active_flights: 0,
};

async function fetchSystemStatus(): Promise<SystemStatus> {
  try {
    return await apiClient.get<SystemStatus>("/api/status");
  } catch (err) {
    if (IS_DEV && !(err instanceof ApiError)) return MOCK_STATUS;
    throw err;
  }
}

async function triggerCheckAll(): Promise<CheckAllSummary> {
  return apiClient.post<CheckAllSummary>("/api/check-all", {});
}

export function useSystemStatus() {
  return useQuery({
    queryKey: ["system-status"],
    queryFn: fetchSystemStatus,
    refetchInterval: 30_000,
    retry: (count, err) => !(err instanceof ApiError) && count < 2,
  });
}

export function useCheckAll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: triggerCheckAll,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["flights"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["system-status"] });
    },
  });
}
