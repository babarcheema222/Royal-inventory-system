import "@/index.css";
import { TRPCProvider } from "@/components/providers/TRPCProvider";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import { InactivityDetector } from "@/components/auth/InactivityDetector";

export const metadata = {
  title: "Royal Karahi | Inventory Management",
  description: "Advanced inventory management system for Royal Karahi",
  icons: {
    icon: "/logo.jpeg",
  },
  verification: {
    google: "google06fda052e1f40535",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>

      <body className="antialiased selection:bg-primary/10 selection:text-primary">
        <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus={false}>
          <InactivityDetector />
          <TRPCProvider>
            {children}
            <Toaster />
          </TRPCProvider>
        </SessionProvider>
      </body>
    </html>
  );
}