import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "./components/BottomNav";
import TopNav from "./components/TopNav";
import IncomingRequest from "./components/IncomingRequest";


const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CodeMap",
  description: "Find your people, not their coordinates",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-white`}>
        <div className="relative mx-auto min-h-screen max-w-sm bg-white shadow-xl">
          <TopNav />
          {children}
          <BottomNav />
          <IncomingRequest />
        </div>
      </body>
    </html>
  );
}
