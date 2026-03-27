import type { Metadata } from "next";
import ErrorBoundary from "@/components/ErrorBoundary";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://ultra1plus.com/vehicle-maintenance-guide'),
  title: {
    template: '%s | Ultra1Plus Vehicle Maintenance Guide',
    default: 'Vehicle Maintenance Guide | Ultra1Plus\u2122',
  },
  description:
    'Find the right motor oil, transmission fluid, coolant, brake fluid, and power steering fluid for your vehicle. ' +
    'Complete fluid specifications, capacities, and maintenance intervals for cars, motorcycles, and marine engines. ' +
    'Premium lubricants by Ultra1Plus.',
  keywords: [
    'vehicle maintenance',
    'motor oil',
    'engine oil',
    'transmission fluid',
    'coolant',
    'brake fluid',
    'power steering fluid',
    'oil specifications',
    'fluid capacity',
    'maintenance schedule',
    'Ultra1Plus',
    'lubricants',
    'synthetic oil',
    '5W-30',
    '0W-20',
    'ATF',
    'car maintenance',
    'motorcycle oil',
    'marine oil',
  ],
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Vehicle Maintenance Guide | Ultra1Plus\u2122',
    description:
      'Look up the right fluids, capacities, and maintenance schedules for your car, motorcycle, or marine engine. Premium lubricants by Ultra1Plus.',
    type: 'website',
    siteName: 'Ultra1Plus Vehicle Maintenance Guide',
    url: 'https://ultra1plus.com/vehicle-maintenance-guide',
    images: [
      {
        url: 'https://cdn11.bigcommerce.com/s-w94u0bjkb6/images/stencil/original/recurso_1_1757027375__15872.original.png',
        width: 600,
        height: 200,
        alt: 'Ultra1Plus Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vehicle Maintenance Guide | Ultra1Plus\u2122',
    description:
      'Find the right motor oil, transmission fluid, coolant, and more for your vehicle. Complete fluid specs and maintenance intervals.',
    images: [
      'https://cdn11.bigcommerce.com/s-w94u0bjkb6/images/stencil/original/recurso_1_1757027375__15872.original.png',
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
