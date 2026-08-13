import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/caveat";
import { GoogleAnalytics } from "@next/third-parties/google";
import { FooterWithRoutes } from "@/components/footer-with-routes";
import { ChatWidget } from "@/components/chat/chat-widget";
import { AuthProvider } from "@/lib/auth/auth-context";
import "flag-icons/css/flag-icons.min.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlyBridge Education Group",
  description:
    "Practical, self-paced video courses that walk you through studying, working, and building a career abroad — one confident step at a time.",
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
          {children}
          <FooterWithRoutes />
          <ChatWidget />
        </AuthProvider>
      </body>
      {GA_MEASUREMENT_ID ? <GoogleAnalytics gaId={GA_MEASUREMENT_ID} /> : null}
    </html>
  );
}
