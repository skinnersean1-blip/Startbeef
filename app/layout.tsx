import type { Metadata } from "next";
import { Inter, Courier_Prime } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const courierPrime = Courier_Prime({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-courier",
});

export const metadata: Metadata = {
  title: "Beef - Paid Dissent Platform",
  description: "Put money where your mouth is. No endless reply chains. Post a claim, price the conviction, and let the internet watch it burn in a controlled arena.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${courierPrime.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
