import type { Metadata, Viewport } from "next";
import { Rethink_Sans } from "next/font/google";
import "./styles.css";

const rethinkSans = Rethink_Sans({
  subsets: ["latin"],
  variable: "--font-rethink-sans",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Dashboard Copilot",
  description: "Recommendation-first dashboard generation for humanitarian data"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={rethinkSans.variable}>
      <body>{children}</body>
    </html>
  );
}
