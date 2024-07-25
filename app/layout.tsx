import "@/styles/globals.css";
import { Inter as FontSans } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import Script from "next/script";
import Image from "next/image";

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
                <header>
                    <Image
                        src="/solt-clash-diary.png"
                        alt="Solt Logo"
                        width={100}
                        height={100}
                    />
                </header>
                {/* <Test /> */}
                {children}
                <footer>
                    Copyright 2024 | Back to main{" "}
                    <a href="https://solt.co.uk">solt.co.uk</a> website
                </footer>
                <Toaster />
                <Script src="iframeMessage.js" strategy="afterInteractive" />
            </body>
        </html>
    );
}
