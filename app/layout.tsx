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
                <header className="flex items-center justify-center py-4 flex-col">
                    <Image
                        src="/solt-clash-diary.png"
                        alt="Solt Logo"
                        width={100}
                        height={100}
                    />
                    <h1 className="text-lg text-center font-bold pt-1">
                        Clash Diary
                    </h1>
                </header>
                {/* <Test /> */}
                {children}
                <footer className="flex items-center justify-center p-4 text-center gap-1">
                    <span>Copyright 2024 | Back to the main</span>
                    <a className="font-medium" href="https://solt.co.uk">
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
