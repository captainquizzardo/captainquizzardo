'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, sendOTP, verifyOTP, user } = useAuth();
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      await signIn(email, password);
      router.push('/dashboard');
    } catch (error) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      try {
        setLoading(true);
        setError('');
        const phoneNumber = '+91' + phone.replace(/\D/g, ''); // Clean and format number
        const vid = await sendOTP(phoneNumber);
        if (vid) {
          setVerificationId(vid);
          setStep(2);
        } else {
          throw new Error('Failed to send OTP');
        }
      } catch (error) {
        setError('Error sending OTP. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      try {
        setLoading(true);
        setError('');
        await verifyOTP(otp);
        router.push('/dashboard');
      } catch (error) {
        setError('Invalid OTP');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-900 dark:via-purple-900 dark:to-pink-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white/10 backdrop-blur-lg rounded-xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white">Welcome Back!</h2>
          <p className="mt-2 text-white/80">Login to continue your quiz journey</p>
        </div>

        <div className="flex justify-center space-x-4 mb-8">
          <button
            onClick={() => {
              setMethod('email');
              setError('');
            }}
            className={`px-4 py-2 rounded-full transition-colors ${
              method === 'email'
                ? 'bg-white text-indigo-600'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            Email
          </button>
          <button
            onClick={() => {
              setMethod('phone');
              setError('');
            }}
            className={`px-4 py-2 rounded-full transition-colors ${
              method === 'phone'
                ? 'bg-white text-indigo-600'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            Phone
          </button>
        </div>

        {method === 'email' ? (
          <form onSubmit={handleEmailLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white">
                Email
              </label>
              <input
                type="email"
                id="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg bg-white/10 border-transparent placeholder-white/50 text-white focus:border-white focus:ring-white"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white">
                Password
              </label>
              <input
                type="password"
                id="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg bg-white/10 border-transparent placeholder-white/50 text-white focus:border-white focus:ring-white"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 rounded-lg text-sm font-medium text-white bg-white/20 hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 transition-colors"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePhoneLogin} className="space-y-6">
            {step === 1 ? (
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-white">
                  Phone Number
                </label>
                <div className="mt-1 flex rounded-lg shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-transparent bg-white/10 text-white text-sm">
                    +91
                  </span>
                  <input
                    type="tel"
                    id="phone"
                    required
                    pattern="[0-9]{10}"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full rounded-none rounded-r-lg bg-white/10 border-transparent placeholder-white/50 text-white focus:border-white focus:ring-white"
                    placeholder="Enter 10-digit number"
                  />
                </div>
                <div id="recaptcha-container" className="mt-4"></div>
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-4 w-full flex justify-center py-2 px-4 rounded-lg text-sm font-medium text-white bg-white/20 hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </div>
            ) : (
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-white">
                  Enter OTP
                </label>
                <input
                  type="text"
                  id="otp"
                  required
                  pattern="[0-9]{6}"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="mt-1 block w-full rounded-lg bg-white/10 border-transparent placeholder-white/50 text-white focus:border-white focus:ring-white"
                  placeholder="Enter 6-digit OTP"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-4 w-full flex justify-center py-2 px-4 rounded-lg text-sm font-medium text-white bg-white/20 hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>
            )}
          </form>
        )}

        {error && (
          <div className="mt-4 text-red-400 text-sm text-center bg-red-500/10 rounded-lg py-2">
            {error}
          </div>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/auth/signup"
            className="text-white/80 hover:text-white transition-colors text-sm"
          >
            Don't have an account? Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
