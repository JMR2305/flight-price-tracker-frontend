import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  Flight,
  FlightCreate,
  FlightDetails,
  FlightPriceHistory,
  FlightSearchResult,
  FlightUpdate,
  StatsData,
  WatchlistItem,
} from "./types";
import { apiClient, ApiError } from "./api-client";
import {
  mockFlights,
  mockStats,
  mockSearchResult,
  mockLastCheckedPrices,
  mockLastChecked,
  mockPriceHistory,
} from "./mock-data";

const IS_DEV = process.env.NODE_ENV === "development";

function warnMockFallback(reason: unknown) {
  if (IS_DEV) {
    console.warn(
      "[api] Backend unreachable — falling back to mock data.",
      reason,
    );
  }
}

function isFallbackError(err: unknown) {
  return IS_DEV && !(err instanceof ApiError);
}

async function fetchFlights(): Promise<Flight[]> {
  try {
    return await apiClient.get<Flight[]>("/api/flights");
  } catch (err) {
    if (isFallbackError(err)) { warnMockFallback(err); return mockFlights; }
    throw err;
  }
}

async function createFlight(data: FlightCreate): Promise<Flight> {
  try {
    return await apiClient.post<Flight>("/api/flights", data);
  } catch (err) {
    if (isFallbackError(err)) {
      warnMockFallback(err);
      return {
        id: Date.now(), ...data,
        return_date: data.return_date ?? null,
        label: data.label ?? null,
        is_active: true,
        date_flexibility: data.date_flexibility ?? 0,
        adults: data.adults ?? 1,
        children: data.children ?? 0,
        infants: data.infants ?? 0,
        cabin_class: data.cabin_class ?? "economy",
        trip_type: data.trip_type ?? "one_way",
        alert_type: data.alert_type ?? "percent_drop",
        alert_value: data.alert_value ?? 5.0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
    throw err;
  }
}

async function updateFlight({
  id,
  data,
}: {
  id: number;
  data: FlightUpdate;
}): Promise<Flight> {
  try {
    return await apiClient.patch<Flight>(`/api/flights/${id}`, data);
  } catch (err) {
    if (isFallbackError(err)) {
      warnMockFallback(err);
      const base = mockFlights.find((f) => f.id === id) ?? mockFlights[0];
      return { ...base, ...data, updated_at: new Date().toISOString() };
    }
    throw err;
  }
}

async function deleteFlight(flightId: number): Promise<void> {
  try {
    await apiClient.delete(`/api/flights/${flightId}`);
  } catch (err) {
    if (isFallbackError(err)) { warnMockFallback(err); return; }
    throw err;
  }
}

async function checkFlight(flightId: number): Promise<FlightSearchResult> {
  try {
    return await apiClient.post<FlightSearchResult>(
      `/api/flights/${flightId}/check`,
      {},
    );
  } catch (err) {
    if (isFallbackError(err)) {
      warnMockFallback(err);
      return { ...mockSearchResult, flight_id: flightId };
    }
    throw err;
  }
}

async function fetchPriceHistory(flightId: number): Promise<FlightPriceHistory> {
  try {
    return await apiClient.get<FlightPriceHistory>(
      `/api/flights/${flightId}/history`,
    );
  } catch (err) {
    if (isFallbackError(err)) {
      warnMockFallback(err);
      const raw = mockPriceHistory[flightId] ?? [];
      return {
        flight_id: flightId,
        points: raw.map((p) => ({
          searched_at: new Date(p.date + " 2025").toISOString(),
          min_price: p.price,
          max_price: p.price + 30,
          currency: "USD",
          offer_count: 3,
        })),
      };
    }
    throw err;
  }
}

async function fetchStats(): Promise<StatsData> {
  try {
    const flights = await apiClient.get<Flight[]>("/api/flights");
    const active = flights.filter((f) => f.is_active);
    return {
      totalFlights: active.length,
      cheapestPrice: null,
      alertsSent: 0,
      nextCheckMinutes: 60,
    };
  } catch (err) {
    if (isFallbackError(err)) { warnMockFallback(err); return mockStats; }
    throw err;
  }
}

async function fetchWatchlist(): Promise<WatchlistItem[]> {
  return apiClient.get<WatchlistItem[]>("/api/watchlist");
}

async function fetchFlightDetails(flightId: number): Promise<FlightDetails> {
  return apiClient.get<FlightDetails>(`/api/flights/${flightId}/details`);
}

const retryOpts = {
  retry: (failureCount: number, err: unknown) =>
    !(err instanceof ApiError) && failureCount < 2,
};

export function useFlights() {
  return useQuery({ queryKey: ["flights"], queryFn: fetchFlights, ...retryOpts });
}

export function useStats() {
  return useQuery({ queryKey: ["stats"], queryFn: fetchStats, ...retryOpts });
}

export function usePriceHistory(flightId: number) {
  return useQuery({
    queryKey: ["price-history", flightId],
    queryFn: () => fetchPriceHistory(flightId),
    ...retryOpts,
  });
}

export function useCreateFlight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createFlight,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["flights"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useUpdateFlight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateFlight,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["flights"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useDeleteFlight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteFlight,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["flights"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useWatchlist() {
  return useQuery({ queryKey: ["watchlist"], queryFn: fetchWatchlist, ...retryOpts });
}

export function useFlightDetails(flightId: number) {
  return useQuery({
    queryKey: ["flight-details", flightId],
    queryFn: () => fetchFlightDetails(flightId),
    ...retryOpts,
  });
}

export function useCheckFlight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: checkFlight,
    onSuccess: (_data, flightId) => {
      qc.invalidateQueries({ queryKey: ["flights"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["price-history", flightId] });
      qc.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });
}

export { mockLastCheckedPrices, mockLastChecked };
