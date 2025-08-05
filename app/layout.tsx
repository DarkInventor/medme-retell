/* eslint-disable @next/next/no-sync-scripts */
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import VoiceWidget from "@/components/voice-widget";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MedMe Pharmacy - AI Appointment Scheduling",
  description: "Book, cancel, and reschedule pharmacy appointments with our AI assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
      {/* <script
       32 -    id="retell-widget"
       33 -    src="https://dashboard.retellai.com/retell-widget.js"
       34 -    type="module"
       35 -    data-public-key="public_key_73c641de4f51ee6bdc6a9"
       36 -    data-agent-id="agent_fbb60038c52a7d59652b0532c9"
       37 -    data-agent-version="v4"
       38 -    data-title="Medme Health"
       39 -    data-logo-url="YOUR_LOGO_URL"
       40 -    data-color="#000000"
       41 -  ></script> */}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
          <VoiceWidget />
        </AuthProvider>
      </body>
    </html>
  );
}
