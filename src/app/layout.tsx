'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ThemeProvider } from 'next-themes';
import Navbar from '@/components/navigation/Navbar';
import Breadcrumbs from '@/components/navigation/Breadcrumbs';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Captain Quizzardo - Interactive Quiz Platform',
  description: 'Join exciting quizzes, compete with others, and win amazing prizes!',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-900 dark:via-purple-900 dark:to-pink-900">
              <Navbar />
              <Breadcrumbs />
              {children}
            </div>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
