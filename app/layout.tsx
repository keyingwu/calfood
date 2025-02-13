import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuroraBackground } from "@/components/ui/aurora-background";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CalFood - AI Food Analysis",
  description: "Analyze your food with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuroraBackground>
          <div className="flex flex-col min-h-screen">
            <header className="container py-6">
              <h1 className="text-4xl font-bold">CalFood</h1>
            </header>
            <main className="container flex-1 relative z-10">{children}</main>
          </div>
          <Toaster />
        </AuroraBackground>
      </body>
    </html>
  );
}
