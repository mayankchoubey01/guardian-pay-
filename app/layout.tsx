import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { MemberProvider } from '@/components/MemberContext';
import { AppShell } from '@/components/AppShell';
import { Toaster } from '@/components/ui/toast';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Family Guardian - AI Family Payment Guardian',
  description: 'An AI agent that watches a family\'s payments and acts before money moves with PayPal holds.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <MemberProvider>
          <AppShell>
            {children}
          </AppShell>
          <Toaster />
        </MemberProvider>
      </body>
    </html>
  );
}