"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Pencil, Minus, Plus } from "lucide-react";
import { useUpdateFlight } from "@/lib/api";
import type { Flight, FlightUpdate } from "@/lib/types";

type TripType = "one_way" | "round_trip";
type CabinClass = "economy" | "premium_economy" | "business" | "first";
type AlertType = "percent_drop" | "below_price" | "every_time" | "once";

interface Props {
  flight: Flight | null;
  onClose: () => void;
}

interface EditFormState {
  origin: string;
  destination: string;
  departure_date: string;
  return_date: string;
  label: string;
  trip_type: TripType;
  date_flexibility: number;
  adults: number;
  children: number;
  infants: number;
  cabin_class: CabinClass;
  alert_type: AlertType;
  alert_value: string;
}

const CABINS_EDIT: { value: CabinClass; label: string }[] = [
  { value: "economy", label: "Economy" },
  { value: "premium_economy", label: "Prem. Eco" },
  { value: "business", label: "Business" },
  { value: "first", label: "First" },
];

const ALERT_TYPES_EDIT: { value: AlertType; label: string }[] = [
  { value: "percent_drop", label: "% Drop" },
  { value: "below_price", label: "Below $" },
  { value: "every_time", label: "Always" },
  { value: "once", label: "Once" },
];

const FLEX_EDIT = [
  { value: 0, label: "Exact" },
  { value: 1, label: "±1d" },
  { value: 2, label: "±2d" },
  { value: 3, label: "±3d" },
];

function EditField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function EditCounter({
  label,
  value,
  onChange,
  min = 0,
  max = 9,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30"
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="w-5 text-center text-sm font-semibold">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

function EditSection({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-1">
      {children}
    </p>
  );
}

export function EditFlightModal({ flight, onClose }: Props) {
  const mutation = useUpdateFlight();
  const [form, setForm] = useState<EditFormState>({
    origin: "", destination: "", departure_date: "", return_date: "",
    label: "", trip_type: "one_way", date_flexibility: 0,
    adults: 1, children: 0, infants: 0, cabin_class: "economy",
    alert_type: "percent_drop", alert_value: "5",
  });
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  useEffect(() => {
    if (flight) {
      setForm({
        origin: flight.origin,
        destination: flight.destination,
        departure_date: flight.departure_date,
        return_date: flight.return_date ?? "",
        label: flight.label ?? "",
        trip_type: (flight.trip_type as TripType) ?? "one_way",
        date_flexibility: flight.date_flexibility ?? 0,
        adults: flight.adults ?? 1,
        children: flight.children ?? 0,
        infants: flight.infants ?? 0,
        cabin_class: (flight.cabin_class as CabinClass) ?? "economy",
        alert_type: (flight.alert_type as AlertType) ?? "percent_drop",
        alert_value: String(flight.alert_value ?? 5),
      });
      setErrors({});
    }
  }, [flight]);

  if (!flight) return null;

  function set<K extends keyof EditFormState>(key: K, value: EditFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const next: typeof errors = {};
    if (!form.origin?.trim()) next.origin = "Required";
    if (!form.destination?.trim()) next.destination = "Required";
    if (!form.departure_date) next.departure_date = "Required";
    if (form.trip_type === "round_trip" && !form.return_date)
      next.return_date = "Required for round-trip";
    if (form.return_date && form.departure_date && form.return_date < form.departure_date)
      next.return_date = "Must be after departure";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!flight || !validate()) return;
    const data: FlightUpdate = {
      origin: form.origin.trim().toUpperCase(),
      destination: form.destination.trim().toUpperCase(),
      departure_date: form.departure_date,
      return_date: form.trip_type === "round_trip" ? form.return_date || null : null,
      label: form.label?.trim() || null,
      trip_type: form.trip_type,
      date_flexibility: form.date_flexibility,
      adults: form.adults,
      children: form.children,
      infants: form.infants,
      cabin_class: form.cabin_class,
      alert_type: form.alert_type,
      alert_value:
        form.alert_type === "percent_drop" || form.alert_type === "below_price"
          ? Number(form.alert_value)
          : null,
    };
    mutation.mutate({ id: flight.id, data }, { onSuccess: onClose });
  }

  const inputCls =
    "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow";
  const errCls =
    "w-full px-3 py-2 text-sm border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-shadow";
  const showAlertValue =
    form.alert_type === "percent_drop" || form.alert_type === "below_price";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => !mutation.isPending && onClose()}
      />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-50 rounded-lg">
              <Pencil className="w-4 h-4 text-amber-600" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900">Edit flight</h2>
          </div>
          <button
            onClick={() => !mutation.isPending && onClose()}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto px-6 py-5 space-y-4 flex-1 min-h-0"
        >
          {/* Route */}
          <EditSection>Route</EditSection>
          <div className="grid grid-cols-2 gap-3">
            <EditField label="Origin *" error={errors.origin}>
              <input
                type="text"
                maxLength={10}
                value={form.origin}
                onChange={(e) => set("origin", e.target.value)}
                className={errors.origin ? errCls : inputCls}
              />
            </EditField>
            <EditField label="Destination *" error={errors.destination}>
              <input
                type="text"
                maxLength={10}
                value={form.destination}
                onChange={(e) => set("destination", e.target.value)}
                className={errors.destination ? errCls : inputCls}
              />
            </EditField>
          </div>

          {/* Trip type */}
          <EditSection>Trip type</EditSection>
          <div className="flex rounded-lg border border-gray-200 p-0.5 gap-0.5">
            {(["one_way", "round_trip"] as TripType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set("trip_type", t)}
                className={`flex-1 text-xs font-medium py-2 rounded-md transition-colors ${
                  form.trip_type === t
                    ? "bg-brand-600 text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {t === "one_way" ? "One-way →" : "Round-trip ↔"}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <EditField label="Departure date *" error={errors.departure_date}>
              <input
                type="date"
                value={form.departure_date}
                onChange={(e) => set("departure_date", e.target.value)}
                className={errors.departure_date ? errCls : inputCls}
              />
            </EditField>
            {form.trip_type === "round_trip" && (
              <EditField label="Return date *" error={errors.return_date}>
                <input
                  type="date"
                  value={form.return_date}
                  onChange={(e) => set("return_date", e.target.value)}
                  className={errors.return_date ? errCls : inputCls}
                />
              </EditField>
            )}
          </div>

          {/* Date flexibility */}
          <EditSection>Date flexibility</EditSection>
          <div className="flex gap-2">
            {FLEX_EDIT.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => set("date_flexibility", opt.value)}
                className={`flex-1 text-xs font-medium py-1.5 rounded-lg border transition-colors ${
                  form.date_flexibility === opt.value
                    ? "border-brand-600 bg-brand-50 text-brand-700"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Cabin class */}
          <EditSection>Cabin class</EditSection>
          <div className="grid grid-cols-4 gap-1.5">
            {CABINS_EDIT.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => set("cabin_class", c.value)}
                className={`text-xs font-medium py-2 rounded-lg border transition-colors ${
                  form.cabin_class === c.value
                    ? "border-brand-600 bg-brand-50 text-brand-700"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Passengers */}
          <EditSection>Passengers</EditSection>
          <div className="border border-gray-100 rounded-xl px-4 divide-y divide-gray-100">
            <EditCounter
              label="Adults (12+)"
              value={form.adults}
              onChange={(v) => set("adults", v)}
              min={1}
            />
            <EditCounter
              label="Children (2–11)"
              value={form.children}
              onChange={(v) => set("children", v)}
            />
            <EditCounter
              label="Infants (under 2)"
              value={form.infants}
              onChange={(v) => set("infants", v)}
              max={4}
            />
          </div>

          {/* Alert settings */}
          <EditSection>Alert settings</EditSection>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {ALERT_TYPES_EDIT.map((a) => (
              <button
                key={a.value}
                type="button"
                onClick={() => set("alert_type", a.value)}
                className={`text-xs font-medium py-2 rounded-lg border transition-colors ${
                  form.alert_type === a.value
                    ? "border-brand-600 bg-brand-50 text-brand-700"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
          {showAlertValue && (
            <EditField
              label={form.alert_type === "percent_drop" ? "Drop threshold (%)" : "Price threshold ($)"}
              error={errors.alert_value}
            >
              <input
                type="number"
                min={0}
                step={form.alert_type === "percent_drop" ? 0.5 : 1}
                value={form.alert_value}
                onChange={(e) => set("alert_value", e.target.value)}
                className={errors.alert_value ? errCls : inputCls}
              />
            </EditField>
          )}

          {/* Label */}
          <EditSection>Label</EditSection>
          <EditField label="Label (optional)">
            <input
              type="text"
              maxLength={255}
              placeholder="e.g. Summer trip"
              value={form.label}
              onChange={(e) => set("label", e.target.value)}
              className={inputCls}
            />
          </EditField>

          {mutation.isError && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">
              {(mutation.error as Error)?.message ?? "Something went wrong."}
            </p>
          )}
        </form>

        {/* Footer */}
        <div className="flex gap-2 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            type="button"
            onClick={() => !mutation.isPending && onClose()}
            disabled={mutation.isPending}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={mutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors disabled:opacity-60"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
