import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../styles/index.css";

export const metadata: Metadata = {
  title: "DeskAtlas",
  description: "DeskAtlas guest booking and workspace discovery experience",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
