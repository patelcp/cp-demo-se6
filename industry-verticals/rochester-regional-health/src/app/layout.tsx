import type { ReactNode } from 'react';
import { Fraunces, Open_Sans } from 'next/font/google';
import './globals.scss';

const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
});

const openSans = Open_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-open-sans',
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${openSans.variable}`}>
      <body className={openSans.className}>{children}</body>
    </html>
  );
}
