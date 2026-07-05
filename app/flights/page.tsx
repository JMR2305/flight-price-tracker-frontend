import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { WatchlistGrid } from "@/components/dashboard/WatchlistGrid";
import { AddFlightButton } from "@/components/dashboard/AddFlightButton";

export default function FlightsPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <TopNav />

        <main className="flex-1 px-4 md:px-6 py-6 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Flights</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Manage your tracked routes and price alerts.
              </p>
            </div>
            <AddFlightButton />
          </div>

          <WatchlistGrid />
        </main>
      </div>
    </div>
  );
}
