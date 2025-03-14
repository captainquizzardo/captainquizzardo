'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/app/firebase';
import { doc, getDoc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { User } from '@/types';

interface BankAccount {
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  bankName: string;
}

export default function WithdrawPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccount, setNewAccount] = useState<BankAccount>({
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    bankName: '',
  });

  const MIN_WITHDRAWAL = 100;

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = { id: userDoc.id, ...userDoc.data() } as User;
          setUserProfile(userData);
          setBankAccounts(userData.bankAccounts || []);
        }
      } catch (error) {
        setError('Error fetching user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setProcessing(true);
      setError('');

      // Validate IFSC code format
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      if (!ifscRegex.test(newAccount.ifscCode)) {
        setError('Invalid IFSC code format');
        return;
      }

      // Add new bank account to user's profile
      const updatedAccounts = [...bankAccounts, newAccount];
      await updateDoc(doc(db, 'users', user.uid), {
        bankAccounts: updatedAccounts,
      });

      setBankAccounts(updatedAccounts);
      setShowAddAccount(false);
      setNewAccount({
        accountNumber: '',
        ifscCode: '',
        accountHolderName: '',
        bankName: '',
      });
      setSuccess('Bank account added successfully');
    } catch (error) {
      setError('Error adding bank account');
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile) return;

    try {
      setProcessing(true);
      setError('');
      setSuccess('');

      const amount = Number(withdrawAmount);
      if (isNaN(amount) || amount < MIN_WITHDRAWAL) {
        setError(`Minimum withdrawal amount is ₹${MIN_WITHDRAWAL}`);
        return;
      }

      if (amount > (userProfile.stats?.totalWinnings || 0)) {
        setError('Insufficient balance');
        return;
      }

      if (!selectedAccount) {
        setError('Please select a bank account');
        return;
      }

      // Create withdrawal request
      await addDoc(collection(db, 'withdrawals'), {
        userId: user.uid,
        amount,
        accountNumber: selectedAccount,
        status: 'pending',
        createdAt: new Date(),
      });

      // Update user's balance
      await updateDoc(doc(db, 'users', user.uid), {
        'stats.totalWinnings': (userProfile.stats?.totalWinnings || 0) - amount,
      });

      setSuccess('Withdrawal request submitted successfully');
      setWithdrawAmount('');
    } catch (error) {
      setError('Error processing withdrawal');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Withdraw Winnings</h1>

          {/* Available Balance */}
          <div className="bg-white/5 rounded-lg p-6 mb-8">
            <div className="text-white/80 mb-2">Available Balance</div>
            <div className="text-4xl font-bold text-white">
              ₹{userProfile?.stats?.totalWinnings || 0}
            </div>
          </div>

          {error && (
            <div className="bg-red-500/20 text-red-300 px-4 py-2 rounded-lg mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/20 text-green-300 px-4 py-2 rounded-lg mb-4">
              {success}
            </div>
          )}

          {/* Bank Account Selection */}
          {!showAddAccount ? (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">
                  Select Bank Account
                </h2>
                <button
                  onClick={() => setShowAddAccount(true)}
                  className="text-sm text-white/80 hover:text-white"
                >
                  + Add New Account
                </button>
              </div>

              {bankAccounts.length > 0 ? (
                <div className="space-y-4">
                  {bankAccounts.map((account, index) => (
                    <label
                      key={index}
                      className={`block p-4 rounded-lg cursor-pointer ${
                        selectedAccount === account.accountNumber
                          ? 'bg-white/20'
                          : 'bg-white/5'
                      }`}
                    >
                      <input
                        type="radio"
                        name="bankAccount"
                        value={account.accountNumber}
                        checked={selectedAccount === account.accountNumber}
                        onChange={(e) => setSelectedAccount(e.target.value)}
                        className="hidden"
                      />
                      <div className="flex justify-between">
                        <div>
                          <div className="font-medium text-white">
                            {account.bankName}
                          </div>
                          <div className="text-white/80 text-sm">
                            {account.accountHolderName}
                          </div>
                          <div className="text-white/60 text-sm">
                            ••••{account.accountNumber.slice(-4)}
                          </div>
                        </div>
                        <div className="text-white/80 text-sm">
                          {account.ifscCode}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-center text-white/80 py-8">
                  No bank accounts added yet
                </div>
              )}
            </div>
          ) : (
            /* Add New Bank Account Form */
            <form onSubmit={handleAddAccount} className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">
                Add New Bank Account
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    value={newAccount.accountHolderName}
                    onChange={(e) =>
                      setNewAccount((prev) => ({
                        ...prev,
                        accountHolderName: e.target.value,
                      }))
                    }
                    required
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={newAccount.accountNumber}
                    onChange={(e) =>
                      setNewAccount((prev) => ({
                        ...prev,
                        accountNumber: e.target.value,
                      }))
                    }
                    required
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={newAccount.ifscCode}
                    onChange={(e) =>
                      setNewAccount((prev) => ({
                        ...prev,
                        ifscCode: e.target.value.toUpperCase(),
                      }))
                    }
                    required
                    pattern="^[A-Z]{4}0[A-Z0-9]{6}$"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={newAccount.bankName}
                    onChange={(e) =>
                      setNewAccount((prev) => ({
                        ...prev,
                        bankName: e.target.value,
                      }))
                    }
                    required
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                  />
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowAddAccount(false)}
                    className="flex-1 px-4 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processing}
                    className="flex-1 px-4 py-2 rounded-full bg-white text-indigo-600 hover:bg-indigo-100 transition-colors disabled:opacity-50"
                  >
                    {processing ? 'Adding...' : 'Add Account'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Withdrawal Form */}
          <form onSubmit={handleWithdraw}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-white mb-2">
                Withdrawal Amount (₹)
              </label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                min={MIN_WITHDRAWAL}
                step="1"
                required
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
              />
              <p className="mt-2 text-sm text-white/60">
                Minimum withdrawal: ₹{MIN_WITHDRAWAL}
              </p>
            </div>

            <button
              type="submit"
              disabled={processing || !selectedAccount}
              className="w-full bg-white text-indigo-600 py-3 rounded-full font-bold hover:bg-indigo-100 transition-colors disabled:opacity-50"
            >
              {processing ? 'Processing...' : 'Withdraw'}
            </button>
          </form>

          {/* Withdrawal History */}
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-white mb-4">
              Recent Withdrawals
            </h2>
            <div className="bg-white/5 rounded-lg divide-y divide-white/10">
              {userProfile?.withdrawals?.map((withdrawal, index) => (
                <div key={index} className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-white font-medium">
                        ₹{withdrawal.amount}
                      </div>
                      <div className="text-white/60 text-sm">
                        {withdrawal.accountNumber}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-sm font-medium ${
                          withdrawal.status === 'completed'
                            ? 'text-green-400'
                            : withdrawal.status === 'pending'
                            ? 'text-yellow-400'
                            : 'text-red-400'
                        }`}
                      >
                        {withdrawal.status.charAt(0).toUpperCase() +
                          withdrawal.status.slice(1)}
                      </div>
                      <div className="text-white/60 text-sm">
                        {new Date(withdrawal.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
