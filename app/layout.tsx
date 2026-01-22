import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShelfSight - AI-Powered Accessibility Vision",
  description: "Speak a brand name, upload a shelf photo, and we'll tell you if it's there. Designed for accessibility with voice feedback.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
