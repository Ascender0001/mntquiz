import './globals.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Nyárhangoló kvíz',
  description: 'Nyári, helyszínhez kötött kvízjáték a Palicsi-tó partján.'
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Extend under notches/rounded corners; we pad with safe-area insets in the UI.
  viewportFit: 'cover',
  themeColor: '#00904d'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hu">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
