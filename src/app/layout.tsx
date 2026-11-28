import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { WhatsAppEnquiryWidget } from "@/components/WhatsAppEnquiryWidget";
import { PwaRegister } from "@/components/PwaRegister";

export const viewport: Viewport = {
  themeColor: "#0B3D62",
};

export const metadata: Metadata = {
  title: "Empire Skills India | National Vocational & Skill Development Portal",
  description:
    "Official institutional portal of Empire Skills India — Online Admissions, Industry-Recognized Skill & Vocational Courses, Student Zone, and Instant QR Certificate Verification.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Empire Skills",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#F7F9FC] text-[#1E293B]">
        <PwaRegister />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <WhatsAppEnquiryWidget />
      </body>
    </html>
  );
}
