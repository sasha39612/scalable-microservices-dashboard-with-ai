import React from "react";
import "../styles/globals.css";

export const metadata = {
  title: "Frontend App",
  description: "Next.js 15 + TypeScript 5.9.2 app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
