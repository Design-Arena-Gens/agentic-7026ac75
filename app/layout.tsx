import "./globals.css";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { cn } from "@/lib/cn";
import { ThemeBackground } from "@/components/theme-background";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Mobile Arena Target Mapping",
  description:
    "Interactive arena planner for mapping mobile combat target assignments."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={cn(inter.variable, jetbrains.variable, "bg-surface text-white")}
    >
      <body className="min-h-screen bg-surface text-white antialiased">
        <ThemeBackground />
        <div className="relative z-10 flex min-h-screen flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
