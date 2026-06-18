import type { Metadata, Viewport } from "next";
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
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#3B82F6" },
    { media: "(prefers-color-scheme: dark)", color: "#3B82F6" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const THEME_INIT = `(function(){
  try {
    var t = localStorage.getItem('RECKONING_THEME_RESOLVED');
    if (t !== 'light' && t !== 'dark') {
      try {
        var raw = localStorage.getItem('RECKONING_THEME');
        if (raw) {
          var parsed = JSON.parse(raw);
          var mode = parsed && parsed.state && parsed.state.mode;
          if (mode === 'light' || mode === 'dark') {
            t = mode;
          } else if (mode === 'system') {
            t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          }
        }
      } catch (_) {}
    }
    if (t !== 'light' && t !== 'dark') { t = 'light'; }
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(t);
    document.documentElement.setAttribute('data-theme', t);
    document.documentElement.style.colorScheme = t;
    if (t === 'dark') {
      document.documentElement.style.backgroundColor = '#1A1F2E';
      document.documentElement.style.color = '#EDF1F7';
    } else {
      document.documentElement.style.backgroundColor = '#EFF2F9';
      document.documentElement.style.color = '#1C2B3A';
    }
  } catch(e) {
    document.documentElement.classList.add('light');
    document.documentElement.style.colorScheme = 'light';
    document.documentElement.style.backgroundColor = '#EFF2F9';
    document.documentElement.style.color = '#1C2B3A';
  }
})();`.replace(/\n\s*/g, '');

const EXTENSION_ATTR_CLEANUP = `(function(){try{function strip(el){if(!el||!el.attributes)return;for(var i=el.attributes.length-1;i>=0;i--){var n=el.attributes[i].name;if(n.indexOf('bis_')===0||n.indexOf('__processed')===0||n==='bis_register'){el.removeAttribute(n);}}}new MutationObserver(function(muts){for(var i=0;i<muts.length;i++){var m=muts[i];if(m.type==='attributes'){var n=m.attributeName||'';if(n.indexOf('bis_')===0||n.indexOf('__processed')===0){if(m.target&&m.target.removeAttribute)m.target.removeAttribute(n);}}else{for(var j=0;j<m.addedNodes.length;j++){strip(m.addedNodes[j]);}}}}).observe(document.documentElement,{attributes:true,childList:true,subtree:true});}catch(e){}})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={`${dmSans.variable} ${dmMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Theme init + extension cleanup — injected via dangerouslySetInnerHTML to run before React hydration */}
        <meta name="color-scheme" content="light dark" />
        <style dangerouslySetInnerHTML={{
          __html: `html.dark{--color-page:#1A1F2E;--color-text-primary:#EDF1F7}html.light{--color-page:#EFF2F9;--color-text-primary:#1C2B3A}body{background-color:var(--color-page,#EFF2F9);color:var(--color-text-primary,#1C2B3A)}`
        }} />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {/* Theme init script — must run before paint to prevent FOUC */}
        {/* eslint-disable-next-line @next/next/no-before-interactive-script-outside-document */}
        <noscript><style dangerouslySetInnerHTML={{ __html: "html{color-scheme:light}" }} /></noscript>
        <div id="__theme_init" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `<script>${THEME_INIT}${EXTENSION_ATTR_CLEANUP}</script>` }} />
        {children}
      </body>
    </html>
  );
}
