import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import Navbar from "./components/navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  weight: ["500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "JobFit",
  description: "Find jobs that fit you",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} min-h-full flex flex-col`}>
        <SessionProvider>
          <Navbar />
          <div className="bg-gray-50 min-h-screen">
            {children}
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
