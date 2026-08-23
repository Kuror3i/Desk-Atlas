import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../styles/index.css";

export const metadata: Metadata = {
  title: "DeskAtlas Admin Portal",
  description: "DeskAtlas internal operations experience",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
