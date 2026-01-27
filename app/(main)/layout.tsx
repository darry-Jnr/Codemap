import type { Metadata } from "next";
import "../globals.css";
// Make sure these paths match where you saved your components
; 
import Navbar from "../components/layout/navbar/Navbar";
import BottomNav from "../components/layout/BottomNav";


export const metadata: Metadata = {
  title: "CODE MAP",
  description: "Navigate your campus with precision codes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="">
      <body className="antialiased min-h-screen flex flex-col">
        {/* The Top Navigation */}
        <Navbar />

        {/* The Main Content (Your Map/Dashboard) */}
        <main className="flex-grow pb-32"> 
          {children}
        </main>

        {/* The Bottom Navigation */}
        <BottomNav />
      </body>
    </html>
  );
}