import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource-variable/caveat";
import { FooterWithRoutes } from "@/components/footer-with-routes";
import { AuthProvider } from "@/lib/auth/auth-context";
import "flag-icons/css/flag-icons.min.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlyBridge Education Group",
  description:
    "Practical, self-paced video courses that walk you through studying, working, and building a career abroad — one confident step at a time.",
};

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
        </AuthProvider>
      </body>
    </html>
  );
}
