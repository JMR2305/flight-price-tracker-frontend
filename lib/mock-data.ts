import type { Flight, FlightSearchResult, StatsData } from "./types";

const FLIGHT_DEFAULTS = {
  date_flexibility: 0,
  adults: 1,
  children: 0,
  infants: 0,
  cabin_class: "economy",
  trip_type: "one_way",
  alert_type: "percent_drop",
  alert_value: 5.0,
} as const;

export const mockFlights: Flight[] = [
  {
    id: 1,
    origin: "MAA",
    destination: "DAD",
    departure_date: "2025-08-15",
    return_date: "2025-08-30",
    label: "Summer Vietnam trip",
    is_active: true,
    created_at: "2025-06-01T10:00:00Z",
    updated_at: "2025-07-03T08:00:00Z",
    ...FLIGHT_DEFAULTS,
    trip_type: "round_trip",
  },
  {
    id: 2,
    origin: "JFK",
    destination: "LHR",
    departure_date: "2025-09-10",
    return_date: null,
    label: "London work trip",
    is_active: true,
    created_at: "2025-06-15T14:30:00Z",
    updated_at: "2025-07-03T08:00:00Z",
    ...FLIGHT_DEFAULTS,
    cabin_class: "business",
  },
  {
    id: 3,
    origin: "SIN",
    destination: "NRT",
    departure_date: "2025-10-01",
    return_date: "2025-10-14",
    label: "Tokyo holiday",
    is_active: true,
    created_at: "2025-06-20T09:15:00Z",
    updated_at: "2025-07-03T08:00:00Z",
    ...FLIGHT_DEFAULTS,
    trip_type: "round_trip",
    date_flexibility: 1,
  },
  {
    id: 4,
    origin: "DXB",
    destination: "BKK",
    departure_date: "2025-11-20",
    return_date: null,
    label: null,
    is_active: true,
    created_at: "2025-07-01T16:45:00Z",
    updated_at: "2025-07-03T08:00:00Z",
    ...FLIGHT_DEFAULTS,
  },
];

export const mockLastCheckedPrices: Record<number, number> = {
  1: 219.5,
  2: 489.0,
  3: 312.75,
  4: 178.0,
};

export const mockLastChecked: Record<number, string> = {
  1: "2025-07-03T08:00:00Z",
  2: "2025-07-03T07:00:00Z",
  3: "2025-07-03T06:00:00Z",
  4: "2025-07-02T18:00:00Z",
};

export const mockSearchResult: FlightSearchResult = {
  id: 1,
  flight_id: 1,
  provider: "mock",
  searched_at: "2025-07-03T08:00:00Z",
  offers: [
    {
      id: 1,
      airline: "IndiGo",
      price: 219.5,
      currency: "USD",
      departure_time: "2025-08-15T06:00:00Z",
      arrival_time: "2025-08-15T14:30:00Z",
      duration_minutes: 510,
      stops: 0,
    },
    {
      id: 2,
      airline: "Air Asia",
      price: 189.0,
      currency: "USD",
      departure_time: "2025-08-15T08:00:00Z",
      arrival_time: "2025-08-15T22:00:00Z",
      duration_minutes: 720,
      stops: 1,
    },
    {
      id: 3,
      airline: "Singapore Airlines",
      price: 589.0,
      currency: "USD",
      departure_time: "2025-08-15T11:00:00Z",
      arrival_time: "2025-08-15T18:00:00Z",
      duration_minutes: 420,
      stops: 0,
    },
  ],
};

export const mockStats: StatsData = {
  totalFlights: mockFlights.length,
  cheapestPrice: Math.min(...Object.values(mockLastCheckedPrices)),
  alertsSent: 12,
  nextCheckMinutes: 47,
};

export const mockPriceHistory: Record<
  number,
  { date: string; price: number }[]
> = {
  1: [
    { date: "Jun 27", price: 265 },
    { date: "Jun 28", price: 258 },
    { date: "Jun 29", price: 240 },
    { date: "Jun 30", price: 252 },
    { date: "Jul 01", price: 235 },
    { date: "Jul 02", price: 228 },
    { date: "Jul 03", price: 219 },
  ],
};
