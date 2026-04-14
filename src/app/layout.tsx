import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Koovis — Personal AI Assistant",
  description:
    "Koovis is a personal AI assistant by Koovis AI. Multi-provider LLM routing with automatic failover across Bedrock, Vertex AI, and Anthropic — one interface, always on.",
  manifest: "/manifest.json",
  metadataBase: new URL("https://pa.koovis.ai"),
  authors: [{ name: "Rajesh Kolachana", url: "https://www.koovis.ai" }],
  creator: "Rajesh Kolachana",
  openGraph: {
    type: "website",
    title: "Koovis — Personal AI Assistant",
    description:
      "Koovis is a personal AI assistant by Koovis AI. Multi-provider LLM routing with automatic failover across Bedrock, Vertex AI, and Anthropic — one interface, always on.",
    url: "https://pa.koovis.ai",
    siteName: "Koovis",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Koovis — Personal AI Assistant",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Koovis — Personal AI Assistant",
    description:
      "Koovis is a personal AI assistant by Koovis AI. Multi-provider LLM routing with automatic failover across Bedrock, Vertex AI, and Anthropic — one interface, always on.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#171717",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
