'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/app/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface SignupForm {
  name: string;
  email: string;
  password: string;
  mobile: string;
  age: string;
  gender: string;
  district: string;
  state: string;
  otp: string;
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

export default function SignupPage() {
  const router = useRouter();
  const { signUp, sendOTP, verifyOTP, user } = useAuth();
  const [form, setForm] = useState<SignupForm>({
    name: '',
    email: '',
    password: '',
    mobile: '',
    age: '',
    gender: '',
    district: '',
    state: '',
    otp: '',
  });
  const [step, setStep] = useState(1);
  const [verificationId, setVerificationId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const phoneNumber = '+91' + form.mobile.replace(/\D/g, '');
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
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      // First verify OTP
      await verifyOTP(form.otp);

      // Then create account
      await signUp(form.email, form.password);

      // Save additional user data to Firestore
      if (user) {
        await setDoc(doc(db, 'users', user.id), {
          name: form.name,
          email: form.email,
          mobile: form.mobile,
          age: parseInt(form.age),
          gender: form.gender,
          district: form.district,
          state: form.state,
          createdAt: new Date(),
          isAdmin: false
        });
      }

      router.push('/dashboard');
    } catch (error) {
      setError('Error creating account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-900 dark:via-purple-900 dark:to-pink-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white/10 backdrop-blur-lg rounded-xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white">Join Captain Quizzardo</h2>
          <p className="mt-2 text-white/80">Create your account to start playing</p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendOTP} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                value={form.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg bg-white/10 border-transparent placeholder-white/50 text-white focus:border-white focus:ring-white"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white">
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                required
                value={form.email}
                onChange={handleChange}
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
                name="password"
                id="password"
                required
                minLength={6}
                value={form.password}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg bg-white/10 border-transparent placeholder-white/50 text-white focus:border-white focus:ring-white"
                placeholder="Choose a strong password"
              />
            </div>

            <div>
              <label htmlFor="mobile" className="block text-sm font-medium text-white">
                Mobile Number
              </label>
              <div className="mt-1 flex rounded-lg shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-transparent bg-white/10 text-white text-sm">
                  +91
                </span>
                <input
                  type="tel"
                  name="mobile"
                  id="mobile"
                  required
                  pattern="[0-9]{10}"
                  value={form.mobile}
                  onChange={handleChange}
                  className="block w-full rounded-none rounded-r-lg bg-white/10 border-transparent placeholder-white/50 text-white focus:border-white focus:ring-white"
                  placeholder="Enter 10-digit number"
                />
              </div>
            </div>

            <div id="recaptcha-container"></div>

            <button
              type="submit"
              disabled={loading || !form.mobile || !form.email || !form.password || !form.name}
              className="w-full flex justify-center py-2 px-4 rounded-lg text-sm font-medium text-white bg-white/20 hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 transition-colors"
            >
              {loading ? 'Sending OTP...' : 'Continue with OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="space-y-6">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-white">
                Enter OTP
              </label>
              <input
                type="text"
                name="otp"
                id="otp"
                required
                pattern="[0-9]{6}"
                value={form.otp}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg bg-white/10 border-transparent placeholder-white/50 text-white focus:border-white focus:ring-white"
                placeholder="Enter 6-digit OTP"
              />
            </div>

            <div>
              <label htmlFor="age" className="block text-sm font-medium text-white">
                Age
              </label>
              <input
                type="number"
                name="age"
                id="age"
                required
                min="13"
                value={form.age}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg bg-white/10 border-transparent placeholder-white/50 text-white focus:border-white focus:ring-white"
                placeholder="Must be 13 or older"
              />
            </div>

            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-white">
                Gender
              </label>
              <select
                name="gender"
                id="gender"
                required
                value={form.gender}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg bg-white/10 border-transparent text-white focus:border-white focus:ring-white"
              >
                <option value="" disabled>Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label htmlFor="state" className="block text-sm font-medium text-white">
                State
              </label>
              <select
                name="state"
                id="state"
                required
                value={form.state}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg bg-white/10 border-transparent text-white focus:border-white focus:ring-white"
              >
                <option value="" disabled>Select state</option>
                {INDIAN_STATES.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="district" className="block text-sm font-medium text-white">
                District
              </label>
              <input
                type="text"
                name="district"
                id="district"
                required
                value={form.district}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg bg-white/10 border-transparent placeholder-white/50 text-white focus:border-white focus:ring-white"
                placeholder="Enter your district"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 rounded-lg text-sm font-medium text-white bg-white/20 hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}

        {error && (
          <div className="mt-4 text-red-400 text-sm text-center bg-red-500/10 rounded-lg py-2">
            {error}
          </div>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/auth/login"
            className="text-white/80 hover:text-white transition-colors text-sm"
          >
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
