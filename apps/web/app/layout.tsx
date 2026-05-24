import type { Metadata } from "next";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Digital Learning Ecosystem",
  description: "Mobile-first web app for learning management and PA evidence portfolio",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SDLE"
  },
  icons: {
    apple: "/icons/icon-192.svg",
    icon: [
      { rel: "icon", type: "image/svg+xml", sizes: "192x192", url: "/icons/icon-192.svg" },
      { rel: "icon", type: "image/svg+xml", sizes: "512x512", url: "/icons/icon-512.svg" }
    ]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
