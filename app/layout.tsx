import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChromaForge — Design System Builder",
  description: "Forge your design system from a single color. Colors, typography, spacing.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-body">{children}</body>
    </html>
  );
}
