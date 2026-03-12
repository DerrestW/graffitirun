import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Graffiti Run Content Engine",
  description: "Operations-first content workflow SaaS for Graffiti Run.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
