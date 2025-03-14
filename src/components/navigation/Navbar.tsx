'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white/10 backdrop-blur-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-white">Captain Quizzardo</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/practice"
              className={`text-white/80 hover:text-white transition-colors ${isActive('/practice') ? 'text-white font-semibold' : ''}`}
            >
              Practice
            </Link>
            <Link 
              href="/quiz/paid"
              className={`text-white/80 hover:text-white transition-colors ${isActive('/quiz/paid') ? 'text-white font-semibold' : ''}`}
            >
              Paid Quizzes
            </Link>
            <Link 
              href="/leaderboard"
              className={`text-white/80 hover:text-white transition-colors ${isActive('/leaderboard') ? 'text-white font-semibold' : ''}`}
            >
              Leaderboard
            </Link>
            {user ? (
              <>
                <Link 
                  href="/profile"
                  className={`text-white/80 hover:text-white transition-colors ${isActive('/profile') ? 'text-white font-semibold' : ''}`}
                >
                  Profile
                </Link>
                {user.isAdmin && (
                  <Link 
                    href="/admin"
                    className={`text-white/80 hover:text-white transition-colors ${isActive('/admin') ? 'text-white font-semibold' : ''}`}
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={() => signOut()}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link 
                href="/auth/login"
                className="bg-white/20 text-white px-4 py-2 rounded-full hover:bg-white/30 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4">
            <div className="flex flex-col space-y-4">
              <Link 
                href="/practice"
                className={`text-white/80 hover:text-white transition-colors ${isActive('/practice') ? 'text-white font-semibold' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Practice
              </Link>
              <Link 
                href="/quiz/paid"
                className={`text-white/80 hover:text-white transition-colors ${isActive('/quiz/paid') ? 'text-white font-semibold' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Paid Quizzes
              </Link>
              <Link 
                href="/leaderboard"
                className={`text-white/80 hover:text-white transition-colors ${isActive('/leaderboard') ? 'text-white font-semibold' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Leaderboard
              </Link>
              {user ? (
                <>
                  <Link 
                    href="/profile"
                    className={`text-white/80 hover:text-white transition-colors ${isActive('/profile') ? 'text-white font-semibold' : ''}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  {user.isAdmin && (
                    <Link 
                      href="/admin"
                      className={`text-white/80 hover:text-white transition-colors ${isActive('/admin') ? 'text-white font-semibold' : ''}`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      signOut();
                      setIsMenuOpen(false);
                    }}
                    className="text-white/80 hover:text-white transition-colors text-left"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link 
                  href="/auth/login"
                  className="bg-white/20 text-white px-4 py-2 rounded-full hover:bg-white/30 transition-colors inline-block"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
