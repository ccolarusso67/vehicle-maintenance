import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vehicle Maintenance Guide | Ultra1Plus™",
  description: "Look up the right fluids, capacities, and maintenance schedules for your vehicle. Premium lubricants and motor oils by Ultra1Plus.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-black">
        {children}
      </body>
    </html>
  );
}
