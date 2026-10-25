import type { Metadata } from "next";
import dynamic from "next/dynamic";
import "@fontsource-variable/inter";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/caveat";
import { GoogleAnalytics } from "@next/third-parties/google";
import { MetaPixel } from "@/components/meta-pixel";
import { MarketingAttributionCapture } from "@/components/marketing-attribution-capture";
import { AffiliateRefCapture } from "@/components/affiliate-ref-capture";
import { FooterWithRoutes } from "@/components/footer-with-routes";
import { AuthProvider } from "@/lib/auth/auth-context";
import { PWAServiceWorker } from "@/components/pwa-service-worker";
import "flag-icons/css/flag-icons.min.css";
import "./globals.css";

const NavigationProgress = dynamic(
  () => import("@/components/navigation-progress").then((m) => m.NavigationProgress),
  { ssr: false, loading: () => null }
);

const ReadinessFab = dynamic(
  () => import("@/components/readiness/readiness-fab").then((m) => m.ReadinessFab),
  { ssr: false, loading: () => null }
);

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://flybridgeedu.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "FlyBridge Education Group",
  description:
    "Practical, self-paced video courses that walk you through studying, working, and building a career abroad — one confident step at a time.",
  manifest: "/manifest.json",
  themeColor: "#6B4CE0",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FlyBridge",
  },
  openGraph: {
    type: "website",
    siteName: "FlyBridge Education Group",
    title: "FlyBridge Education Group",
    description:
      "Practical, self-paced video courses that walk you through studying, working, and building a career abroad — one confident step at a time.",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "FlyBridge Education Group",
    description:
      "Practical, self-paced video courses that walk you through studying, working, and building a career abroad — one confident step at a time.",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="application-name" content="FlyBridge" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="FlyBridge" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <AuthProvider>
          <PWAServiceWorker />
          <NavigationProgress />
          {children}
          <FooterWithRoutes />
          <ReadinessFab />
          <MarketingAttributionCapture />
          <AffiliateRefCapture />
        </AuthProvider>
      </body>
      {GA_MEASUREMENT_ID ? <GoogleAnalytics gaId={GA_MEASUREMENT_ID} /> : null}
      <MetaPixel />
    </html>
  );
}
