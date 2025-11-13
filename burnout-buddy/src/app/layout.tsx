import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans-body",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const heading = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Burnout Buddy",
  description:
    "A serene companion for physicians to check in, reset quickly, and stay ahead of burnout with mindful micro-practices.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${heading.variable} bg-transparent antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
