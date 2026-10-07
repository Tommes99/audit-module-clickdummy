import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { HydrationGate } from "@/components/shell/hydration-gate";
import { AppShell } from "@/components/shell/app-shell";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Audit-Modul Clickdummy",
  description: "Klickbarer Dummy eines Audit-Moduls für ESG, EHS und GRC (Demo, fiktive Daten)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // suppressHydrationWarning: Browser-Erweiterungen (Dark Mode, Übersetzung) ändern oft Attribute an html und body vor der Hydrierung
  return (
    <html lang="de" className={`${inter.variable} ${plexMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full bg-background text-foreground" suppressHydrationWarning>
        <TooltipProvider delay={150}>
          <HydrationGate>
            <AppShell>{children}</AppShell>
          </HydrationGate>
        </TooltipProvider>
        <Toaster theme="light" position="top-center" closeButton />
      </body>
    </html>
  );
}
