'use client';

import '../styles/globals.css';
import { ReactNode } from 'react';
import Navbar from '@/components/layout/Navbar';
import { ApolloProvider } from '@apollo/client/react';
import client from '@/utils/apollo-client';
import { AuthProvider } from '@/contexts/AuthContext';

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white min-h-screen">
        <AuthProvider>
          <ApolloProvider client={client}>
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>
          </ApolloProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
