"use client";

import { AchievementsPage } from "@/components/achievements";
import { useAuthStore } from "@/stores/authStore";
import { shouldUseMock } from "@/lib/useMock";

export default function AchievementsRoute() {
  const email = useAuthStore((state) => state.user?.email);

  if (!shouldUseMock(email)) {
    return (
      <div className="p-6">
        <div className="neu-card p-5">
          <p className="text-sm text-[var(--color-text-secondary)]">Live achievements data is not available yet.</p>
        </div>
      </div>
    );
  }

  return <AchievementsPage />;
}
