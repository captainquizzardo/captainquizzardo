'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/app/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

interface Question {
  text: string;
  options: string[];
  correctOption: number;
  points: number;
  timeLimit: number;
}

interface QuizForm {
  title: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  startTime: string;
  duration: number;
  entryFee: number;
  prizePool: number;
  maxParticipants: number;
  questions: Question[];
}

export default function CreateQuizPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [quizForm, setQuizForm] = useState<QuizForm>({
    title: '',
    description: '',
    category: '',
    difficulty: 'medium',
    startTime: '',
    duration: 30,
    entryFee: 0,
    prizePool: 0,
    maxParticipants: 100,
    questions: [],
  });

  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    text: '',
    options: ['', '', '', ''],
    correctOption: 0,
    points: 10,
    timeLimit: 30,
  });

  const categories = [
    'General Knowledge',
    'Science',
    'Technology',
    'Sports',
    'Entertainment',
    'History',
    'Geography',
    'Literature',
    'Mathematics',
  ];

  const handleQuizInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setQuizForm((prev) => ({
      ...prev,
      [name]: name === 'entryFee' || name === 'prizePool' || name === 'maxParticipants' || name === 'duration'
        ? Number(value)
        : value,
    }));
  };

  const handleQuestionInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setCurrentQuestion((prev) => ({
      ...prev,
      [name]: name === 'points' || name === 'timeLimit' || name === 'correctOption'
        ? Number(value)
        : value,
    }));
  };

  const handleOptionChange = (index: number, value: string) => {
    setCurrentQuestion((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) => (i === index ? value : opt)),
    }));
  };

  const addQuestion = () => {
    if (!currentQuestion.text || currentQuestion.options.some((opt) => !opt)) {
      setError('Please fill in all question fields');
      return;
    }

    setQuizForm((prev) => ({
      ...prev,
      questions: [...prev.questions, currentQuestion],
    }));

    setCurrentQuestion({
      text: '',
      options: ['', '', '', ''],
      correctOption: 0,
      points: 10,
      timeLimit: 30,
    });

    setError('');
  };

  const removeQuestion = (index: number) => {
    setQuizForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      if (quizForm.questions.length < 5) {
        setError('Quiz must have at least 5 questions');
        return;
      }

      const startTime = new Date(quizForm.startTime);
      if (startTime < new Date()) {
        setError('Start time must be in the future');
        return;
      }

      // Calculate total points
      const totalPoints = quizForm.questions.reduce(
        (sum, q) => sum + q.points,
        0
      );

      // Create quiz document
      const quizData = {
        ...quizForm,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        startTime,
        status: 'scheduled',
        totalPoints,
        participants: [],
        antiCheat: {
          tabSwitchLimit: 3,
          screenshotDetection: true,
          multipleLoginPrevention: true,
        },
      };

      await addDoc(collection(db, 'quizzes'), quizData);
      setSuccess('Quiz created successfully');

      // Reset form
      setQuizForm({
        title: '',
        description: '',
        category: '',
        difficulty: 'medium',
        startTime: '',
        duration: 30,
        entryFee: 0,
        prizePool: 0,
        maxParticipants: 100,
        questions: [],
      });

      // Redirect to quiz management
      router.push('/admin/quiz');
    } catch (error) {
      setError('Error creating quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8">
          <h1 className="text-3xl font-bold text-white mb-8">Create New Quiz</h1>

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

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Quiz Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Quiz Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={quizForm.title}
                  onChange={handleQuizInputChange}
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Category
                </label>
                <select
                  name="category"
                  value={quizForm.category}
                  onChange={handleQuizInputChange}
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Difficulty
                </label>
                <select
                  name="difficulty"
                  value={quizForm.difficulty}
                  onChange={handleQuizInputChange}
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  name="startTime"
                  value={quizForm.startTime}
                  onChange={handleQuizInputChange}
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  name="duration"
                  value={quizForm.duration}
                  onChange={handleQuizInputChange}
                  required
                  min="5"
                  max="180"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Entry Fee (₹)
                </label>
                <input
                  type="number"
                  name="entryFee"
                  value={quizForm.entryFee}
                  onChange={handleQuizInputChange}
                  required
                  min="0"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Prize Pool (₹)
                </label>
                <input
                  type="number"
                  name="prizePool"
                  value={quizForm.prizePool}
                  onChange={handleQuizInputChange}
                  required
                  min="0"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Max Participants
                </label>
                <input
                  type="number"
                  name="maxParticipants"
                  value={quizForm.maxParticipants}
                  onChange={handleQuizInputChange}
                  required
                  min="10"
                  max="1000"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={quizForm.description}
                onChange={handleQuizInputChange}
                required
                rows={4}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
              />
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">
                Questions ({quizForm.questions.length})
              </h2>
              {quizForm.questions.map((question, index) => (
                <div
                  key={index}
                  className="bg-white/5 rounded-lg p-4 space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-white">
                        {index + 1}. {question.text}
                      </h3>
                      <div className="mt-2 space-y-1">
                        {question.options.map((option, optIndex) => (
                          <div
                            key={optIndex}
                            className={`text-sm ${
                              optIndex === question.correctOption
                                ? 'text-green-400'
                                : 'text-white/80'
                            }`}
                          >
                            {String.fromCharCode(65 + optIndex)}. {option}
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 text-sm text-white/60">
                        Points: {question.points} • Time: {question.timeLimit}s
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeQuestion(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Question Form */}
            <div className="bg-white/5 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-medium text-white">Add Question</h3>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Question Text
                </label>
                <textarea
                  name="text"
                  value={currentQuestion.text}
                  onChange={handleQuestionInputChange}
                  rows={2}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQuestion.options.map((option, index) => (
                  <div key={index}>
                    <label className="block text-sm font-medium text-white mb-2">
                      Option {String.fromCharCode(65 + index)}
                    </label>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Correct Option
                  </label>
                  <select
                    name="correctOption"
                    value={currentQuestion.correctOption}
                    onChange={handleQuestionInputChange}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                  >
                    {currentQuestion.options.map((_, index) => (
                      <option key={index} value={index}>
                        Option {String.fromCharCode(65 + index)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Points
                  </label>
                  <input
                    type="number"
                    name="points"
                    value={currentQuestion.points}
                    onChange={handleQuestionInputChange}
                    min="5"
                    max="100"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Time Limit (seconds)
                  </label>
                  <input
                    type="number"
                    name="timeLimit"
                    value={currentQuestion.timeLimit}
                    onChange={handleQuestionInputChange}
                    min="10"
                    max="300"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={addQuestion}
                className="w-full bg-white/10 text-white py-2 rounded-lg hover:bg-white/20 transition-colors"
              >
                Add Question
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || quizForm.questions.length < 5}
              className="w-full bg-white text-indigo-600 py-3 rounded-full font-bold hover:bg-indigo-100 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating Quiz...' : 'Create Quiz'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
