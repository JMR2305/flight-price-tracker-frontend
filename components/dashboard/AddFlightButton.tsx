"use client";

import { useState } from "react";
import { AddFlightModal } from "./AddFlightModal";

export function AddFlightButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-brand-600 hover:text-brand-700 px-3 py-1.5 rounded-lg border border-brand-200 hover:bg-brand-50 transition-colors"
      >
        + Add flight
      </button>
      <AddFlightModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
