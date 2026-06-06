import { getLocale, getMessages } from "next-intl/server";

import { DashboardIntlProvider } from "@/components/dashboard/DashboardIntlProvider";
import { CitizenShell } from "@/components/dashboard/CitizenShell";

export default async function CitizenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <DashboardIntlProvider
      initialLocale={locale}
      initialMessages={messages as Record<string, unknown>}
    >
      <CitizenShell>{children}</CitizenShell>
    </DashboardIntlProvider>
  );
}
