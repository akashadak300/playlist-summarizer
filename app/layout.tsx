import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Playlist Summarizer",
  description: "Summarize your YouTube playlists",
};

import Navbar from "@/components/Navbar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body>
        <Navbar />

        <div className="container" style={{ marginTop: '104px' /* 64px header + 40px margin */ }}>
          {children}
        </div>
      </body>
    </html>
  );
}
