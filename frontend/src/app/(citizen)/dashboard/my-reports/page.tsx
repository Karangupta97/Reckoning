"use client";

import { MyReportsPage } from "@/components/my-reports";

export default function MyReportsRoute() {
  return (
    <div className="h-[calc(100dvh-4rem-6rem)] lg:h-[calc(100dvh-4rem)] -mt-2 overflow-hidden overflow-x-hidden max-w-[100vw]">
      <MyReportsPage />
    </div>
  );
}
