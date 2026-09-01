import type { Metadata } from "next";
import "@/styles/tokens.css";
import "@/styles/globals.css";
import { AuthProvider } from "@/features/auth";

export const metadata: Metadata = {
  title: "DeskAtlas Staff Dashboard",
  description: "Management Portal for DeskAtlas Staff",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
