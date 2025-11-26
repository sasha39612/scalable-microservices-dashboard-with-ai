'use client';

import Link from 'next/link';
import { useState } from 'react';
import { FiMenu, FiX, FiLogOut, FiUser } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const toggleMenu = () => setIsOpen(!isOpen);

  // Don't show navbar on login/register pages
  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
            {'Microservices Dashboard'}
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
              {'Home'}
            </Link>
            <Link
              href="/dashboard"
              className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              {'Dashboard'}
            </Link>
            <Link
              href="/analytics"
              className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              {'Analytics'}
            </Link>
            <Link
              href="/tasks"
              className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              {'Tasks'}
            </Link>
            <Link
              href="/ai-chat"
              className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              {'AI Chat'}
            </Link>
            <Link
              href="/profile"
              className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              {'Profile'}
            </Link>

            {/* User menu */}
            {user ? (
              <div className="flex items-center space-x-4 ml-4 border-l border-gray-300 dark:border-gray-600 pl-4">
                <div className="flex items-center space-x-2">
                  <FiUser className="text-gray-600 dark:text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{user.name}</span>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400"
                  title="Logout"
                >
                  <FiLogOut />
                  <span className="text-sm">Logout</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold"
              >
                {'Login'}
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={toggleMenu} className="text-gray-700 dark:text-gray-300 focus:outline-none">
              {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white dark:bg-gray-800 px-2 pt-2 pb-3 space-y-1">
          <Link
            href="/"
            className="block text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            onClick={() => setIsOpen(false)}
          >
            {'Home'}
          </Link>
          <Link
            href="/dashboard"
            className="block text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            onClick={() => setIsOpen(false)}
          >
            {'Dashboard'}
          </Link>
          <Link
            href="/analytics"
            className="block text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            onClick={() => setIsOpen(false)}
          >
            {'Analytics'}
          </Link>
          <Link
            href="/tasks"
            className="block text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            onClick={() => setIsOpen(false)}
          >
            {'Tasks'}
          </Link>
          <Link
            href="/ai-chat"
            className="block text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            onClick={() => setIsOpen(false)}
          >
            {'AI Chat'}
          </Link>
          <Link
            href="/profile"
            className="block text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            onClick={() => setIsOpen(false)}
          >
            {'Profile'}
          </Link>

          {/* Mobile User menu */}
          {user ? (
            <div className="border-t border-gray-300 dark:border-gray-600 pt-2 mt-2">
              <div className="flex items-center space-x-2 px-3 py-2">
                <FiUser className="text-gray-600 dark:text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{user.name}</span>
              </div>
              <button
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400"
              >
                <FiLogOut />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="block text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold px-3 py-2"
              onClick={() => setIsOpen(false)}
            >
              {'Login'}
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
