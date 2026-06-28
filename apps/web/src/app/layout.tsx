import type { Metadata } from 'next';
import { SITE_NAME, SITE_URL } from '@/lib/seo';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Altogether Agile - Agile Coaching & Training',
    template: `%s - ${SITE_NAME}`,
  },
  description:
    'Framework-based agile training and coaching, with 80+ techniques and 25 years of hands-on experience for teams who want real results.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
