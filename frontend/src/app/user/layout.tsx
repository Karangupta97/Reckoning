import type { Metadata, Viewport } from "next";
import Script from "next/script";
import CitizenShell from "@/components/user/CitizenShell";
import { ThemeProvider } from "@/components/user/ThemeProvider";
import { LanguageProvider } from "@/components/user/LanguageProvider";
import { LocationProvider } from "@/components/user/LocationProvider";
import { CitizenProfileProvider } from "@/components/user/CitizenProfileProvider";
import "@/style/reckoning.css";
import "@/style/reckoning-v2.css";

export const metadata: Metadata = {
  title: "Reckoning — Road Transparency Dashboard",
  description:
    "Anonymous civic-tech platform for road accountability across South Asia. AI detection, contractor transparency, community impact.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafbfc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

const themeInitScript = `(function(){try{var t=localStorage.getItem('reckoning-theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme:light)').matches?'light':'dark';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Script id="reckoning-theme-init" strategy="beforeInteractive">
        {themeInitScript}
      </Script>
      <ThemeProvider>
        <LanguageProvider>
          <LocationProvider>
            <CitizenProfileProvider>
              <div className="rk-citizen-body">
                <CitizenShell>{children}</CitizenShell>
              </div>
            </CitizenProfileProvider>
          </LocationProvider>
        </LanguageProvider>
      </ThemeProvider>
    </>
  );
}
