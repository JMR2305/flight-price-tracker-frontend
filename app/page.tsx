"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Plane, Bell, TrendingDown, BarChart2 } from "lucide-react";

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <header className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Plane className="h-5 w-5 text-blue-600" />
          <span className="font-semibold text-gray-900">Flight Price Tracker</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Get started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 rounded-full mb-6">
          <TrendingDown className="h-3.5 w-3.5" />
          Automated price monitoring
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight max-w-2xl">
          Never overpay for a flight again
        </h1>
        <p className="mt-4 text-lg text-gray-500 max-w-xl">
          Track any route, set your alert rules, and get notified the moment prices drop —
          powered by real-time data and smart scheduling.
        </p>

        <div className="mt-8 flex items-center gap-3">
          <Link
            href="/register"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Start tracking for free
          </Link>
          <Link
            href="/login"
            className="text-gray-600 px-6 py-3 rounded-lg font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Sign in
          </Link>
        </div>

        {/* Feature grid */}
        <div className="mt-20 grid sm:grid-cols-3 gap-6 max-w-3xl w-full text-left">
          {[
            {
              icon: <Bell className="h-5 w-5 text-blue-600" />,
              title: "Smart alerts",
              desc: "Get Telegram or WhatsApp notifications when prices drop by your chosen threshold.",
            },
            {
              icon: <TrendingDown className="h-5 w-5 text-blue-600" />,
              title: "Flexible date search",
              desc: "Search ±1–3 days around your target date and always catch the cheapest window.",
            },
            {
              icon: <BarChart2 className="h-5 w-5 text-blue-600" />,
              title: "Price history charts",
              desc: "See how prices have moved over time so you can spot trends and book at the right moment.",
            },
          ].map((f) => (
            <div key={f.title} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center mb-3">
                {f.icon}
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">{f.title}</h3>
              <p className="text-gray-500 text-sm mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-gray-100 px-6 py-4 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} Flight Price Tracker
      </footer>
    </div>
  );
}
