import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Das trevas para a luz, da academia para a escola: todo “erro” tem uma história",
  description: "Plataforma educacional sobre história, mudança e variação da língua portuguesa.",
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
    <html lang="pt-BR">
      <head>
        <link rel="stylesheet" href="/assets/style.css" />
        <link rel="stylesheet" href="/assets/comic.css?v=interactive-comic-1" />
        <link rel="stylesheet" href="/assets/references.css" />
        <link rel="stylesheet" href="/assets/navigation.css?v=server-reports-8" />
        <link rel="stylesheet" href="/assets/progress.css?v=server-reports-8" />
      </head>
      <body>{children}</body>
    </html>
  );
}
