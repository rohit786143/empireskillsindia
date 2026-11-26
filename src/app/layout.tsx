import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Empire Skills India | National Vocational & Skill Development Portal",
  description:
    "Official institutional portal of Empire Skills India — Online Admissions, Industry-Recognized Skill & Vocational Courses, Student Zone, and Instant QR Certificate Verification.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#F7F9FC] text-[#1E293B]">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
