import type { Metadata } from "next";
import { Inter, Space_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import Layout from "@/components/Layout";
import ToastProvider from "@/components/ToastProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "GuardOS | Compliance & License Management",
  description: "Advanced industrial infrastructure management and compliance tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceMono.variable} antialiased bg-slate-950`}>
        <Providers>
          <ToastProvider />
          <Layout>
            {children}
          </Layout>
        </Providers>
      </body>
    </html>
  );
}
