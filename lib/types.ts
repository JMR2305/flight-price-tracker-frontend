export interface Flight {
  id: number;
  origin: string;
  destination: string;
  departure_date: string;
  return_date: string | null;
  label: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  date_flexibility: number;
  adults: number;
  children: number;
  infants: number;
  cabin_class: string;
  trip_type: string;
  alert_type: string;
  alert_value: number | null;
}

export interface FlightCreate {
  origin: string;
  destination: string;
  departure_date: string;
  return_date?: string | null;
  label?: string | null;
  date_flexibility?: number;
  adults?: number;
  children?: number;
  infants?: number;
  cabin_class?: string;
  trip_type?: string;
  alert_type?: string;
  alert_value?: number | null;
}

export interface FlightUpdate {
  origin?: string;
  destination?: string;
  departure_date?: string;
  return_date?: string | null;
  label?: string | null;
  is_active?: boolean;
  date_flexibility?: number;
  adults?: number;
  children?: number;
  infants?: number;
  cabin_class?: string;
  trip_type?: string;
  alert_type?: string;
  alert_value?: number | null;
}

export interface FlightOffer {
  id: number;
  airline: string;
  price: number;
  currency: string;
  departure_time: string;
  arrival_time: string;
  duration_minutes: number;
  stops: number;
}

export interface FlightSearchResult {
  id: number;
  flight_id: number;
  provider: string;
  searched_at: string;
  offers: FlightOffer[];
}

export interface PriceHistoryPoint {
  searched_at: string;
  min_price: number;
  max_price: number;
  currency: string;
  offer_count: number;
}

export interface FlightPriceHistory {
  flight_id: number;
  points: PriceHistoryPoint[];
}

export interface StatsData {
  totalFlights: number;
  cheapestPrice: number | null;
  alertsSent: number;
  nextCheckMinutes: number;
}

export interface FlightStats {
  total_searches: number;
  total_offers_seen: number;
  notifications_sent: number;
  lowest_price: number | null;
  highest_price: number | null;
  average_price: number | null;
  current_price: number | null;
  currency: string | null;
  last_checked_at: string | null;
}

export interface LatestSearchMeta {
  id: number;
  provider: string;
  searched_at: string;
  offer_count: number;
}

export interface NotificationRecord {
  id: number;
  channel: string;
  recipient: string;
  status: string;
  sent_at: string | null;
  created_at: string;
}

export interface FlightDetails {
  flight: Flight;
  stats: FlightStats;
  price_history: PriceHistoryPoint[];
  latest_offers: FlightOffer[];
  notifications: NotificationRecord[];
  latest_search: LatestSearchMeta | null;
}

export interface WatchlistItem {
  flight_id: number;
  origin: string;
  destination: string;
  departure_date: string;
  return_date: string | null;
  label: string | null;
  is_active: boolean;
  current_price: number | null;
  lowest_price: number | null;
  highest_price: number | null;
  average_price: number | null;
  currency: string | null;
  last_checked_at: string | null;
  total_searches: number;
  total_offers_seen: number;
  notifications_sent: number;
  date_flexibility: number;
  adults: number;
  children: number;
  infants: number;
  cabin_class: string;
  trip_type: string;
  alert_type: string;
  alert_value: number | null;
}

export interface ApiError {
  detail: string;
  status: number;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  email: string;
  full_name: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  full_name: string;
  password: string;
}
