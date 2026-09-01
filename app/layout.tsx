import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Skogfilter – artsfunn og tiltak",
  description: "Kartbasert beslutningsstøtte for vurdering av artsfunn mot planlagte skogbrukstiltak.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nb">
      <body className="antialiased">{children}</body>
    </html>
  );
}
