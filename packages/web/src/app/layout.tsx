import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Providers } from './providers';

import '@rainbow-me/rainbowkit/styles.css';

export const metadata: Metadata = {
  title: 'CumMillionaire - Win Big with CUMMIES!',
  description: 'Participate in the CumRocket lottery on BNB Chain. Deposit CUMMIES tokens and win the jackpot when it reaches 1 million!',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersObj = await headers();
  const cookies = headersObj.get('cookie');

  return (
    <html lang="en" suppressHydrationWarning>
    <body>
    <Providers cookies={cookies}>{children}</Providers>
    </body>
    </html>
  );
}
