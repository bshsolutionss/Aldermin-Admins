import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aldermin Admin Portal",
  description: "Aldermin school administration portal for students, staff, and operations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
