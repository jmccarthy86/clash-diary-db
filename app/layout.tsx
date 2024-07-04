import { GraphAuthProvider } from '../context/GraphAuthContext';
import "@/styles/globals.css";
import { Inter as FontSans } from "next/font/google";
import Header from "@/components/page-header/page-header";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster"

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
