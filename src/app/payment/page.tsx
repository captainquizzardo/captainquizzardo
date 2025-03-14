'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/app/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import { Quiz } from '@/types';
import { processPayment } from '@/services/payment';

export default function PaymentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const quizId = searchParams?.get('quizId');

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    const fetchQuizDetails = async () => {
      if (!quizId) {
        setError('Quiz ID not provided');
        setLoading(false);
        return;
      }

      try {
        const quizDoc = await getDoc(doc(db, 'quizzes', quizId));
        if (quizDoc.exists()) {
          setQuiz({ id: quizDoc.id, ...quizDoc.data() } as Quiz);
        } else {
          setError('Quiz not found');
        }
      } catch (error) {
        setError('Error fetching quiz details');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizDetails();
  }, [quizId]);

  const handlePayment = async () => {
    if (!quiz || !user) return;

    try {
      setProcessingPayment(true);
      setError('');

      // Simulate a successful payment
      const paymentResult = await processPayment({
        amount: quiz.entryFee || 0,
        userId: user.uid,
        quizId: quiz.id,
        paymentMethods: ['phonepe', 'googlepay', 'upi']
      });

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Payment failed.');
      }

      // Update quiz participants
      await updateDoc(doc(db, 'quizzes', quiz.id), {
        participants: [...(quiz.participants || []), user.uid],
      });

      // Create payment record
      await updateDoc(doc(db, 'users', user.uid), {
        payments: {
          quizId: quiz.id,
          amount: quiz.entryFee,
          timestamp: new Date(),
          status: 'completed',
        },
      });

      // Redirect to quiz page
      router.push(`/quiz/${quiz.id}`);
    } catch (error) {
      if (error instanceof Error) {
        setError('Payment failed: ' + error.message);
      } else {
        setError('Payment failed: Unknown error occurred.');
      }
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-white text-xl">Loading payment details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-white text-xl">{error}</div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-white text-xl">Quiz not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8 text-center">
            Payment Details
          </h1>

          {/* Quiz Summary */}
          <div className="bg-white/5 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">
              {quiz.title}
            </h2>
            <div className="space-y-2 text-white/80">
              <p>{quiz.description}</p>
              <div className="flex justify-between items-center mt-4">
                <span>Entry Fee:</span>
                <span className="text-2xl font-bold text-white">
                  ₹{quiz.entryFee}
                </span>
              </div>
            </div>
          </div>

          {/* Prize Pool */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {quiz.prizeMoney?.map((prize, index) => (
              <div
                key={index}
                className="bg-white/5 rounded-lg p-4 text-center"
              >
                <div className="text-white/80 mb-1">
                  {index === 0 ? '1st' : index === 1 ? '2nd' : '3rd'} Prize
                </div>
                <div className="text-xl font-bold text-white">
                  ₹{prize.toLocaleString()}
                </div>
              </div>
            )) || <div>No prizes available</div>}
          </div>

          {/* Payment Method Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-white mb-4">
              Select Payment Method
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {(['upi', 'card', 'netbanking'] as const).map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`p-4 rounded-lg text-center ${
                    paymentMethod === method
                      ? 'bg-white text-indigo-600'
                      : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  {method.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Details Form */}
          {paymentMethod === 'upi' && (
            <div className="mb-8">
              <label className="block text-sm font-medium text-white mb-2">
                UPI ID
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="username@upi"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50"
              />
              <div className="mt-4 flex items-center justify-center space-x-4">
                <img
                  src="/phonepe-logo.png"
                  alt="PhonePe"
                  className="h-8 opacity-80 hover:opacity-100 cursor-pointer"
                />
                <img
                  src="/gpay-logo.png"
                  alt="Google Pay"
                  className="h-8 opacity-80 hover:opacity-100 cursor-pointer"
                />
                <img
                  src="/paytm-logo.png"
                  alt="Paytm"
                  className="h-8 opacity-80 hover:opacity-100 cursor-pointer"
                />
              </div>
            </div>
          )}

          {paymentMethod === 'card' && (
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Card Number
                </label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    CVV
                  </label>
                  <input
                    type="password"
                    placeholder="123"
                    maxLength={3}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50"
                  />
                </div>
              </div>
            </div>
          )}

          {paymentMethod === 'netbanking' && (
            <div className="mb-8">
              <label className="block text-sm font-medium text-white mb-2">
                Select Bank
              </label>
              <select className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white">
                <option value="">Choose your bank</option>
                <option value="sbi">State Bank of India</option>
                <option value="hdfc">HDFC Bank</option>
                <option value="icici">ICICI Bank</option>
                <option value="axis">Axis Bank</option>
              </select>
            </div>
          )}

          {/* Terms and Conditions */}
          <div className="mb-8">
            <label className="flex items-center space-x-2 text-white/80">
              <input type="checkbox" className="rounded text-indigo-600" />
              <span className="text-sm">
                I agree to the terms and conditions and confirm that I am above 18
                years of age.
              </span>
            </label>
          </div>

          {/* Pay Button */}
          <button
            onClick={handlePayment}
            disabled={processingPayment}
            className="w-full bg-white text-indigo-600 py-3 rounded-full font-bold hover:bg-indigo-100 transition-colors disabled:opacity-50"
          >
            {processingPayment
              ? 'Processing Payment...'
              : `Pay ₹${quiz.entryFee}`}
          </button>

          {/* Secure Payment Notice */}
          <div className="mt-6 text-center text-white/60 text-sm">
            🔒 Secure payment powered by Razorpay
          </div>
        </div>
      </div>
    </div>
  );
}
