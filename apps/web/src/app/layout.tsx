
import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" });

export const metadata: Metadata = {
    title: "Zaha AI | AI-Powered Virtual Try-On by Brandzaha Creative Agency",
    description: "Enterprise AI solution for Fashion Retailers. Manage inventory, subscriptions, and virtual try-ons with Zaha AI.",
    icons: {
        icon: "/favicon.ico",
    },
};

export const viewport: Viewport = {
    themeColor: "#006D66",
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${inter.variable} ${playfair.variable} font-sans bg-gray-50 text-gray-900 antialiased`}>
                {children}
            </body>
        </html>
    );
}
