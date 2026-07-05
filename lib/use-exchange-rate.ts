"use client";

  import { useState, useEffect } from "react";

  const CACHE_KEY = "usd_inr_rate";
  const CACHE_TTL = 24 * 60 * 60 * 1000;
  const FALLBACK_RATE = 84;

  export function useUSDToINR(): number {
    const [rate, setRate] = useState<number>(() => {
      if (typeof window === "undefined") return FALLBACK_RATE;
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { rate: r, ts } = JSON.parse(cached);
          if (Date.now() - ts < CACHE_TTL && typeof r === "number") return r;
        }
      } catch { /* ignore */ }
      return FALLBACK_RATE;
    });

    useEffect(() => {
      let cancelled = false;
      async function fetchRate() {
        try {
          const cached = localStorage.getItem(CACHE_KEY);
          if (cached) {
            const { rate: r, ts } = JSON.parse(cached);
            if (Date.now() - ts < CACHE_TTL && typeof r === "number") {
              setRate(r);
              return;
            }
          }
          const res = await fetch("https://open.er-api.com/v6/latest/USD");
          if (!res.ok) return;
          const data = await res.json();
          const inrRate = data?.rates?.INR;
          if (typeof inrRate === "number" && !cancelled) {
            setRate(inrRate);
            localStorage.setItem(CACHE_KEY, JSON.stringify({ rate: inrRate, ts: Date.now() }));
          }
        } catch { /* keep fallback */ }
      }
      fetchRate();
      return () => { cancelled = true; };
    }, []);

    return rate;
  }
  