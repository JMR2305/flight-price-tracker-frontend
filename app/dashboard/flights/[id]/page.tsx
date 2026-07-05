import { FlightDetailsView } from "@/components/dashboard/FlightDetailsView";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";

export default async function FlightDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const flightId = Number(id);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav />
        <main className="flex-1 px-4 md:px-6 py-6">
          <FlightDetailsView flightId={flightId} />
        </main>
      </div>
    </div>
  );
}
