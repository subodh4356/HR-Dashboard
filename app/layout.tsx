import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers";

import ToasterClient from '@/components/ToasterClient';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HR Dashboard",
  description: "Modern HR Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
          <ToasterClient />
        </Providers>
      </body>
    </html>
  );
}
