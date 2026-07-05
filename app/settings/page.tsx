import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <TopNav />

        <main className="flex-1 px-4 md:px-6 py-6">
          <div className="mb-6">
            <h1 className="text-lg font-semibold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage your account preferences and notification channels.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
              <Settings className="w-6 h-6 text-gray-500" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900 mb-1">
              Settings coming soon
            </h2>
            <p className="text-sm text-gray-500 max-w-xs">
              Profile details, notification channel configuration (Telegram,
              WhatsApp), and account management will be available here.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
