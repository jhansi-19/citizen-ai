import type { Metadata } from "next";
import { Sora, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Citizen AI — Grounded Indian Government Schemes & Welfare Intelligence",
  description: "Citation-grounded assistant for Indian Government schemes and welfare policies with page citations, safe calculations, live search, and privacy protection.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sora.variable} ${jakarta.variable}`}>
      <body className="font-sans antialiased bg-slate-50 text-slate-900 selection:bg-saffron/30 selection:text-saffron-700">
        {children}
      </body>
    </html>
  );
}
