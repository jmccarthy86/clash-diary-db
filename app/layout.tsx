import "@/styles/globals.css";
import { Inter as FontSans } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster"
import Script from 'next/script'
import { Test } from '@/components/bookings/test' 

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

interface RootLayoutProps {
  children: React.ReactNode;
}

// <script src="http://localhost:8097"></script>

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={cn(
          "min-h-screen bg-muted/70 font-sans antialiased",
          fontSans.variable
        )}
      >
		{/* <Test /> */}
        {children}
        <Toaster />
		<Script
			src="../lib/iframeMessage.js"
			strategy="afterInteractive"
		/>
      </body>
    </html>
  );
}
