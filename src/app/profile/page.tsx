'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/app/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { User } from '@/types';
import Image from 'next/image';

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    age: '',
    gender: '',
    district: '',
    state: '',
    profilePicture: '',
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = { id: userDoc.id, ...userDoc.data() } as User;
          setUserProfile(userData);
          setFormData({
            name: userData.name || '',
            email: userData.email || '',
            mobile: userData.mobile || '',
            age: userData.age?.toString() || '',
            gender: userData.gender || '',
            district: userData.district || '',
            state: userData.state || '',
            profilePicture: userData.profilePicture || '',
          });
        }
      } catch (error) {
        setError('Error fetching user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      await updateDoc(doc(db, 'users', user.uid), {
        ...formData,
        age: parseInt(formData.age),
        updatedAt: new Date(),
      });

      setSuccess('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      setError('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-white text-xl">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-white">My Profile</h1>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 rounded-full bg-white text-indigo-600 hover:bg-indigo-100 transition-colors"
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Profile Picture and Stats */}
            <div className="space-y-6">
              <div className="bg-white/5 rounded-lg p-6 text-center">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  {formData.profilePicture ? (
                    <Image
                      src={formData.profilePicture}
                      alt="Profile"
                      fill
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-white/20 flex items-center justify-center text-4xl text-white">
                      {formData.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                {isEditing && (
                  <input
                    type="file"
                    accept="image/*"
                    className="text-sm text-white/80"
                  />
                )}
              </div>

              {/* Quick Stats */}
              <div className="bg-white/5 rounded-lg p-6 space-y-4">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Quiz Stats
                </h3>
                <div className="flex justify-between text-white/80">
                  <span>Quizzes Played</span>
                  <span className="font-medium text-white">
                    {userProfile?.stats?.totalQuizzes || 0}
                  </span>
                </div>
                <div className="flex justify-between text-white/80">
                  <span>Win Rate</span>
                  <span className="font-medium text-white">
                    {userProfile?.stats?.winRate || 0}%
                  </span>
                </div>
                <div className="flex justify-between text-white/80">
                  <span>Total Winnings</span>
                  <span className="font-medium text-white">
                    ₹{userProfile?.stats?.totalWinnings || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSubmit} className="md:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Age
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white disabled:opacity-50"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    District
                  </label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white disabled:opacity-50"
                  />
                </div>
              </div>

              {isEditing && (
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-8 w-full bg-white text-indigo-600 py-3 rounded-full font-bold hover:bg-indigo-100 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving Changes...' : 'Save Changes'}
                </button>
              )}
            </form>
          </div>

          {/* Recent Activity */}
          <div className="mt-12">
            <h2 className="text-2xl font-semibold text-white mb-6">
              Recent Activity
            </h2>
            <div className="bg-white/5 rounded-lg divide-y divide-white/10">
              {userProfile?.recentActivity?.map((activity, index) => (
                <div key={index} className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-white font-medium">
                        {activity.quizTitle}
                      </h3>
                      <p className="text-white/60 text-sm">
                        Score: {activity.score} • Rank: #{activity.rank}
                      </p>
                    </div>
                    <div className="text-white/60 text-sm">
                      {new Date(activity.timestamp).toLocaleDateString()}
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
