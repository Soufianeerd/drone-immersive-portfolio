import type { Metadata } from "next";
import { Geist, Geist_Mono, Michroma } from "next/font/google";
import EnvironmentProvider from "@/lib/environment/EnvironmentProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const michroma = Michroma({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NADRA — Anass · Photo, vidéo, drone FPV",
  description: "Portfolio audiovisuel d'Anass : prises de vue en drone FPV, photo et vidéo.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} ${michroma.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Avant le premier rendu : permet de masquer le hero jusqu'à son apparition animée. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="min-h-full bg-ink">
        <EnvironmentProvider>{children}</EnvironmentProvider>
      </body>
    </html>
  );
}
