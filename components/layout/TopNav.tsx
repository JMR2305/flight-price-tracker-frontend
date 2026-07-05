"use client";

import { Bell, Search, Menu } from "lucide-react";

export function TopNav() {
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <button className="md:hidden p-1.5 rounded-md text-gray-500 hover:bg-gray-100">
          <Menu className="w-5 h-5" />
        </button>
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search flights..."
            className="pl-9 pr-4 py-1.5 text-sm bg-gray-100 border-0 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-600 rounded-full" />
        </button>
        <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-semibold">
          U
        </div>
      </div>
    </header>
  );
}
