import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import BottomNav from "@/components/BottomNav";
import OfflineBanner from "@/components/OfflineBanner";
import AddToHomeNudge from "@/components/AddToHomeNudge";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Time Audit",
  description: "Track where your time actually goes",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Time Audit",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        {/* Set dark class before hydration to prevent flash */}
        <Script id="theme-init" strategy="beforeInteractive">{`
          (function() {
            try {
              var stored = localStorage.getItem('theme');
              var theme = stored || 'dark';
              document.documentElement.classList.toggle('dark', theme === 'dark');
            } catch(e) {
              document.documentElement.classList.add('dark');
            }
          })();
        `}</Script>
      </head>
      <body className={`${inter.variable} antialiased bg-background text-foreground`}>
        <ThemeProvider>
          <OfflineBanner />
          {children}
          <BottomNav />
          <AddToHomeNudge />
        </ThemeProvider>
      </body>
    </html>
  );
}
