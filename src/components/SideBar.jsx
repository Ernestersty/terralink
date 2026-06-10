import { Home, Building2, Heart, MessageSquare, Settings } from "lucide-react";

export default function Sidebar({ role }) {
  return (
    <aside className="w-64 bg-white shadow-lg p-6">
      <h1 className="text-3xl font-bold text-green-700 mb-10">
        Terralink
      </h1>

      <nav className="space-y-4">
        <div className="flex gap-3 p-3 rounded-xl bg-green-100">
          <Home />
          Dashboard
        </div>

        {role === "buyer" && (
          <>
            <div className="flex gap-3 p-3">
              <Building2 />
              Properties
            </div>

            <div className="flex gap-3 p-3">
              <Heart />
              Saved
            </div>
          </>
        )}

        {role === "seller" && (
          <>
            <div className="flex gap-3 p-3">
              <Building2 />
              My Listings
            </div>

            <div className="flex gap-3 p-3">
              <MessageSquare />
              Offers
            </div>
          </>
        )}

        <div className="flex gap-3 p-3">
          <Settings />
          Settings
        </div>
      </nav>
    </aside>
  );
}
