import "@/styles/globals.css";
import { Inter as FontSans } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import Script from "next/script";
import Image from "next/image";

import localFont from "next/font/local";
const OpenSans = localFont({
    src: [
        {
            path: "../public/OpenSans-Regular.woff2",
            weight: "400",
            style: "normal",
        },
        {
            path: "../public/OpenSans-Italic.woff2",
            weight: "400",
            style: "italic",
        },
        {
            path: "../public/OpenSans-Bold.woff2",
            weight: "700",
            style: "normal",
        },
    ],
    variable: "--font-open-sans",
});

// New Heading Font
const HeadingFont = localFont({
    src: [{ path: "../public/FuturaPTBold/font.woff2", weight: "700", style: "normal" }],
    variable: "--font-heading", // Custom CSS variable for heading font
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
                    OpenSans.variable,
                    HeadingFont.variable
                )}
            >
                <header className="flex flex-col items-center justify-between p-4 bg-solt-bg md:flex-row md:items-center md:justify-between lg:flex-row lg:items-center lg:justify-between max-[1030px]:flex-wrap max-[1030]:gap-4">
                    <Image
                        src="/first-night-diary-logo.svg"
                        alt="Solt Logo"
                        width={200}
                        height={86}
                    />
                    <div className="header-actions flex flex-col gap-3 mt-4 lg:flex-row lg:mt-0 lg:gap-3">
                        <a className="header-button" href="https://solt.co.uk">
                            Return to SOLT website
                        </a>
                        <a className="header-button" href="https://uktheatre.org">
                            Return to UK Theatre website
                        </a>
                        <a
                            className="header-button header-button-logout bg-solt-gold border-gold border-[3px]"
                            href="https://solt.co.uk/?logout=true"
                        >
                            Log Out
                        </a>
                    </div>
                </header>
                <h1 className="text-lg text-center font-bold pt-1 mt-6 mb-2">First Night Diary</h1>
                {children}
                <footer className="flex items-center justify-center p-4 text-center gap-1">
                    <span>Copyright 2024 | Back to the main</span>
                    <a target="_parent" className="font-medium" href="https://solt.co.uk">
                        solt.co.uk
                    </a>
                    <span>website</span>
                </footer>
                <Toaster />
                <Script src="iframeMessage.js" strategy="afterInteractive" />
            </body>
        </html>
    );
}
