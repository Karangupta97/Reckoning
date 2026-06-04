import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { DM_Sans, DM_Mono } from "next/font/google";
import { getLocale } from "next-intl/server";

import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  applicationName: "Reckoning",
  title: {
    default: "Reckoning — Roads that report themselves",
    template: "%s · Reckoning",
  },
  description:
    "AI-powered civic road damage reporting for BIMSTEC nations. Snap. Submit. Track.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Reckoning",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#EFF2F9" },
    { media: "(prefers-color-scheme: dark)", color: "#1A1F2E" },
  ],
  width: "device-width",
  initialScale: 1,
};

/**
 * Pre-hydration guard against DOM-mutating browser extensions.
 *
 * Some extensions (e.g. Bitdefender) inject attributes like `bis_skin_checked`
 * and `bis_register` onto elements before React hydrates, which triggers
 * hydration mismatch warnings even though the rendered markup is correct.
 *
 * This runs in `<head>` before `<body>` is parsed, installs a MutationObserver
 * on the document, and strips those attributes as the extension adds them so
 * React sees the same DOM it server-rendered. It is a no-op for users without
 * such extensions.
 */
const EXTENSION_ATTR_CLEANUP = `(function(){try{function strip(el){if(!el||!el.attributes)return;for(var i=el.attributes.length-1;i>=0;i--){var n=el.attributes[i].name;if(n.indexOf('bis_')===0||n.indexOf('__processed')===0||n==='bis_register'){el.removeAttribute(n);}}}new MutationObserver(function(muts){for(var i=0;i<muts.length;i++){var m=muts[i];if(m.type==='attributes'){var n=m.attributeName||'';if(n.indexOf('bis_')===0||n.indexOf('__processed')===0){if(m.target&&m.target.removeAttribute)m.target.removeAttribute(n);}}else{for(var j=0;j<m.addedNodes.length;j++){strip(m.addedNodes[j]);}}}}).observe(document.documentElement,{attributes:true,childList:true,subtree:true});}catch(e){}})();`;

/**
 * Pre-hydration theme init.
 *
 * Applies the saved theme (or the OS `prefers-color-scheme`) class to <html>
 * before the first paint so there is no flash of the wrong theme, and so the
 * ThemeToggle can read the already-applied class after mount.
 */
const THEME_INIT = `(function(){try{var t=localStorage.getItem('RECKONING_THEME');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.classList.remove('light','dark');document.documentElement.classList.add(t);}catch(e){}})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // `lang` is set dynamically from the active locale negotiated by the proxy.
  const locale = await getLocale();

  return (
    // `suppressHydrationWarning` absorbs attribute mismatches from browser
    // extensions (e.g. Bitdefender injects `bis_skin_checked` / `bis_register`)
    // and the locale-driven `lang`/font classes set on the server.
    <html
      lang={locale}
      className={`${dmSans.variable} ${dmMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Script id="reckoning-theme-init" strategy="beforeInteractive">
          {THEME_INIT}
        </Script>
        <Script id="reckoning-extension-cleanup" strategy="beforeInteractive">
          {EXTENSION_ATTR_CLEANUP}
        </Script>
        {children}
      </body>
    </html>
  );
}
