import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Promos – Sound Promo Manager",
  description:
    "Modern promo management for sounds: manage promos, payments, customers and sounds in one place.",
  openGraph: {
    title: "Promos – Sound Promo Manager",
    description:
      "Modern promo management for sounds: manage promos, payments, customers and sounds in one place.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Promos – Sound Promo Manager",
    description:
      "Modern promo management for sounds: manage promos, payments, customers and sounds in one place.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <Toaster />
          <Sonner position="top-right" richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}
