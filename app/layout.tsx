import type { Metadata } from "next";
import { Chakra_Petch, Outfit, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";

const display = Chakra_Petch({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

const sans = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "$ANSEM — Cashtag Viral Leaderboard + Airdrop",
  description:
    "Find the most viral X posts for a cashtag and airdrop tokens to the creators on Solana.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <body>
        <div className="fx" aria-hidden>
          <div className="fx-grid" />
          <div className="fx-orb fx-orb-1" />
          <div className="fx-orb fx-orb-2" />
          <div className="fx-vignette" />
          <div className="fx-grain" />
        </div>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
