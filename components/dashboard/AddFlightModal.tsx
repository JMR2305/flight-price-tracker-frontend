"use client";

import { useState } from "react";
import { X, Loader2, Plane, Minus, Plus } from "lucide-react";
import { useCreateFlight } from "@/lib/api";
import type { FlightCreate } from "@/lib/types";

type TripType = "one_way" | "round_trip";
type CabinClass = "economy" | "premium_economy" | "business" | "first";
type AlertType = "percent_drop" | "below_price" | "every_time" | "once";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface FormState {
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

const EMPTY: FormState = {
  origin: "",
  destination: "",
  departure_date: "",
  return_date: "",
  label: "",
  trip_type: "one_way",
  date_flexibility: 0,
  adults: 1,
  children: 0,
  infants: 0,
  cabin_class: "economy",
  alert_type: "percent_drop",
  alert_value: "5",
};

const CABINS: { value: CabinClass; label: string }[] = [
  { value: "economy", label: "Economy" },
  { value: "premium_economy", label: "Premium Eco" },
  { value: "business", label: "Business" },
  { value: "first", label: "First" },
];

const ALERT_TYPES: { value: AlertType; label: string; hint: string }[] = [
  { value: "percent_drop", label: "% Drop", hint: "Notify when price drops by N%" },
  { value: "below_price", label: "Below $", hint: "Notify when price goes below $N" },
  { value: "every_time", label: "Always", hint: "Notify on every price check" },
  { value: "once", label: "Once only", hint: "Notify only the first time" },
];

const FLEX_OPTIONS = [
  { value: 0, label: "Exact" },
  { value: 1, label: "±1 day" },
  { value: 2, label: "±2 days" },
  { value: 3, label: "±3 days" },
];

function Field({
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
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function Counter({
  label,
  sub,
  value,
  onChange,
  min = 0,
  max = 9,
}: {
  label: string;
  sub?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm text-gray-800 font-medium">{label}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-colors"
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="w-5 text-center text-sm font-semibold text-gray-900">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-colors"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-1">
      {children}
    </p>
  );
}

export function AddFlightModal({ open, onClose }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const mutation = useCreateFlight();

  if (!open) return null;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const next: typeof errors = {};
    if (!form.origin.trim()) next.origin = "Required";
    else if (form.origin.trim().length < 2) next.origin = "Min 2 characters";
    if (!form.destination.trim()) next.destination = "Required";
    else if (form.destination.trim().length < 2) next.destination = "Min 2 characters";
    if (!form.departure_date) next.departure_date = "Required";
    if (form.trip_type === "round_trip" && !form.return_date)
      next.return_date = "Required for round-trip";
    if (form.return_date && form.departure_date && form.return_date < form.departure_date)
      next.return_date = "Must be after departure";
    if (
      (form.alert_type === "percent_drop" || form.alert_type === "below_price") &&
      (!form.alert_value || Number(form.alert_value) < 0)
    )
      next.alert_value = "Enter a positive number";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!validate()) return;
    const payload: FlightCreate = {
      origin: form.origin.trim().toUpperCase(),
      destination: form.destination.trim().toUpperCase(),
      departure_date: form.departure_date,
      return_date: form.trip_type === "round_trip" ? form.return_date || null : null,
      label: form.label.trim() || null,
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
    mutation.mutate(payload, {
      onSuccess: () => {
        setForm(EMPTY);
        setErrors({});
        onClose();
      },
    });
  }

  function handleClose() {
    if (mutation.isPending) return;
    setForm(EMPTY);
    setErrors({});
    onClose();
  }

  const inputCls =
    "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow";
  const errCls =
    "w-full px-3 py-2 text-sm border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-shadow";
  const showAlertValue =
    form.alert_type === "percent_drop" || form.alert_type === "below_price";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-brand-50 rounded-lg">
              <Plane className="w-4 h-4 text-brand-600" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900">Track a new flight</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={mutation.isPending}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable form body */}
        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto px-6 py-5 space-y-4 flex-1 min-h-0"
        >
          {/* Route */}
          <SectionLabel>Route</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Origin *" error={errors.origin}>
              <input
                type="text"
                placeholder="e.g. MAA"
                maxLength={10}
                value={form.origin}
                onChange={(e) => set("origin", e.target.value)}
                className={errors.origin ? errCls : inputCls}
              />
            </Field>
            <Field label="Destination *" error={errors.destination}>
              <input
                type="text"
                placeholder="e.g. DAD"
                maxLength={10}
                value={form.destination}
                onChange={(e) => set("destination", e.target.value)}
                className={errors.destination ? errCls : inputCls}
              />
            </Field>
          </div>

          {/* Trip type */}
          <SectionLabel>Trip type</SectionLabel>
          <div className="flex rounded-lg border border-gray-200 p-0.5 gap-0.5">
            {(["one_way", "round_trip"] as TripType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set("trip_type", t)}
                className={`flex-1 text-xs font-medium py-2 rounded-md transition-colors ${
                  form.trip_type === t
                    ? "bg-brand-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {t === "one_way" ? "One-way →" : "Round-trip ↔"}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Departure date *" error={errors.departure_date}>
              <input
                type="date"
                value={form.departure_date}
                onChange={(e) => set("departure_date", e.target.value)}
                className={errors.departure_date ? errCls : inputCls}
              />
            </Field>
            {form.trip_type === "round_trip" && (
              <Field label="Return date *" error={errors.return_date}>
                <input
                  type="date"
                  value={form.return_date}
                  onChange={(e) => set("return_date", e.target.value)}
                  className={errors.return_date ? errCls : inputCls}
                />
              </Field>
            )}
          </div>

          {/* Date flexibility */}
          <SectionLabel>Date flexibility</SectionLabel>
          <div className="flex gap-2">
            {FLEX_OPTIONS.map((opt) => (
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
          <p className="text-xs text-gray-400 -mt-1">
            {form.date_flexibility === 0
              ? "Search only on your exact departure date."
              : `Search ${form.date_flexibility} day${form.date_flexibility > 1 ? "s" : ""} before and after to find the best fare.`}
          </p>

          {/* Cabin class */}
          <SectionLabel>Cabin class</SectionLabel>
          <div className="grid grid-cols-4 gap-1.5">
            {CABINS.map((c) => (
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
          <SectionLabel>Passengers</SectionLabel>
          <div className="border border-gray-100 rounded-xl px-4 divide-y divide-gray-100">
            <Counter
              label="Adults"
              sub="Age 12+"
              value={form.adults}
              onChange={(v) => set("adults", v)}
              min={1}
            />
            <Counter
              label="Children"
              sub="Age 2–11"
              value={form.children}
              onChange={(v) => set("children", v)}
            />
            <Counter
              label="Infants"
              sub="Under 2 (lap)"
              value={form.infants}
              onChange={(v) => set("infants", v)}
              max={4}
            />
          </div>

          {/* Alert settings */}
          <SectionLabel>Alert settings</SectionLabel>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {ALERT_TYPES.map((a) => (
              <button
                key={a.value}
                type="button"
                onClick={() => set("alert_type", a.value)}
                title={a.hint}
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
            <Field
              label={form.alert_type === "percent_drop" ? "Drop threshold (%)" : "Price threshold ($)"}
              error={errors.alert_value}
            >
              <input
                type="number"
                min={0}
                step={form.alert_type === "percent_drop" ? 0.5 : 1}
                placeholder={form.alert_type === "percent_drop" ? "5" : "300"}
                value={form.alert_value}
                onChange={(e) => set("alert_value", e.target.value)}
                className={errors.alert_value ? errCls : inputCls}
              />
            </Field>
          )}
          <p className="text-xs text-gray-400 -mt-1">
            {ALERT_TYPES.find((a) => a.value === form.alert_type)?.hint}
          </p>

          {/* Label */}
          <SectionLabel>Label (optional)</SectionLabel>
          <Field label="Label">
            <input
              type="text"
              placeholder="e.g. Summer Vietnam trip"
              maxLength={255}
              value={form.label}
              onChange={(e) => set("label", e.target.value)}
              className={inputCls}
            />
          </Field>

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
            onClick={handleClose}
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
              "Track flight"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
