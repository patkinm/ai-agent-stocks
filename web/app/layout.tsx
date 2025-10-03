import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Stock Analyzer',
  description: 'AI-powered stock analysis for short-term trading',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
