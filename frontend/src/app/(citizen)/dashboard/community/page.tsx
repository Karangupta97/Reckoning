"use client";

import { CommunityPage } from "@/components/community";

export default function CommunityRoute() {
  return (
    <div className="h-[calc(100dvh-4rem-6rem)] lg:h-[calc(100dvh-4rem)] -mt-2 overflow-hidden overflow-x-hidden max-w-[100vw]">
      <CommunityPage />
    </div>
  );
}
