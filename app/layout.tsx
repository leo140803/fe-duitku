import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { Inter } from "next/font/google";
import { Navigation } from "@/components/UI";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "Duitku - Finance Management App",
  description: "Track your income, expenses, and manage your finances with ease. Join thousands of users who are already taking control of their finances with Duitku.",
  keywords: "finance, money, budget, expense tracker, income tracker, personal finance, money management",
  authors: [{ name: "Duitku Team" }],
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3b82f6',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <AuthProvider>
          <Navigation />
          <div className="container mx-auto px-4 py-8 min-h-screen">
            <div className="max-w-4xl mx-auto">
              {children}
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}