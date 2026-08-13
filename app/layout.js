export const metadata = {
  title: 'Weeether - BC Weather',
  description: 'Real-time weather forecasts for cities across British Columbia, Canada',
  manifest: '/manifest.json',
  themeColor: '#0284c7',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Weeether'
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false
  },
  icons: {
    icon: [
      { url: '/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
      { url: '/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' }
    ],
    apple: '/icon-192.svg'
  }
};

import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0284c7" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Weeether" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}