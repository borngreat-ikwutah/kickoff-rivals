import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useState } from "react";
import { useGame } from "../contexts/GameContext";
import { AdminAuth } from "../components/AdminAuth";

const AdminPortal = lazy(() =>
  import("../components/AdminPortal").then((mod) => ({
    default: mod.AdminPortal,
  })),
);

export const Route = createFileRoute("/admin")({
  component: AdminRoute,
});

function AdminRoute() {
  const navigate = useNavigate();
  const {
    adminSessionValid,
    adminSessionToken,
    handleAdminAuthSuccess,
    handleAdminLogout,
    coupons,
    setCoupons,
    userStats,
    setUserStats,
    matches,
    fetchMatches,
  } = useGame();

  const [showAuth, setShowAuth] = useState(!adminSessionValid);

  if (!adminSessionValid || showAuth) {
    return (
      <AdminAuth
        onAuthSuccess={() => {
          handleAdminAuthSuccess();
          setShowAuth(false);
        }}
        onCancel={() => navigate({ to: "/dashboard" })}
      />
    );
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-gray-400">
              Loading Admin Portal...
            </p>
          </div>
        </div>
      }
    >
      <AdminPortal
        coupons={coupons}
        setCoupons={setCoupons}
        quests={userStats.quests}
        setQuests={(q) => setUserStats((p) => ({ ...p, quests: q }))}
        onClose={async () => {
          await handleAdminLogout();
          navigate({ to: "/dashboard" });
        }}
        sessionToken={adminSessionToken || ""}
        matches={matches}
        onRefreshMatches={fetchMatches}
      />
    </Suspense>
  );
}
