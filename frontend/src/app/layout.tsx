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

const THEME_INIT = `(function(){try{var t=localStorage.getItem('RECKONING_THEME');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.classList.remove('light','dark');document.documentElement.classList.add(t);document.documentElement.style.colorScheme=t;}catch(e){}})();`;

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
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        <script dangerouslySetInnerHTML={{ __html: EXTENSION_ATTR_CLEANUP }} />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
