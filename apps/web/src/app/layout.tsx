import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/caveat";
import { GoogleAnalytics } from "@next/third-parties/google";
import { FooterWithRoutes } from "@/components/footer-with-routes";
import { NavigationProgress } from "@/components/navigation-progress";
import { ChatWidget } from "@/components/chat/chat-widget";
import { ReadinessFab } from "@/components/readiness/readiness-fab";
import { AuthProvider } from "@/lib/auth/auth-context";
import "flag-icons/css/flag-icons.min.css";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://flybridgeedu.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "FlyBridge Education Group",
  description:
    "Practical, self-paced video courses that walk you through studying, working, and building a career abroad — one confident step at a time.",
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
};

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthProvider>
          <NavigationProgress />
          {children}
          <FooterWithRoutes />
          <ReadinessFab />
          <ChatWidget />
        </AuthProvider>
      </body>
      {GA_MEASUREMENT_ID ? <GoogleAnalytics gaId={GA_MEASUREMENT_ID} /> : null}
    </html>
  );
}
