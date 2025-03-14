'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/app/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Quiz, Question } from '@/types';

interface QuestionForm extends Omit<Question, 'id'> {
  id?: string;
}

export default function CreateQuizPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [questions, setQuestions] = useState<QuestionForm[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionForm>({
    text: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    timeLimit: 30,
    points: 10,
  });

  const [quizDetails, setQuizDetails] = useState({
    title: '',
    description: '',
    type: 'free' as 'free' | 'paid',
    entryFee: 0,
    startTime: '',
    duration: 30,
    prizeMoney: [0, 0, 0], // First, Second, Third prizes
  });

  const handleQuizDetailsChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setQuizDetails((prev) => ({
      ...prev,
      [name]: name === 'entryFee' || name === 'duration' ? Number(value) : value,
    }));
  };

  const handlePrizeMoneyChange = (index: number, value: string) => {
    setQuizDetails((prev) => ({
      ...prev,
      prizeMoney: prev.prizeMoney.map((prize, i) =>
        i === index ? Number(value) : prize
      ),
    }));
  };

  const handleQuestionChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setCurrentQuestion((prev) => ({
      ...prev,
      [name]: name === 'timeLimit' || name === 'points' ? Number(value) : value,
    }));
  };

  const handleOptionChange = (index: number, value: string) => {
    setCurrentQuestion((prev) => ({
      ...prev,
      options: prev.options.map((option, i) => (i === index ? value : option)),
    }));
  };

  const addQuestion = () => {
    if (!currentQuestion.text || currentQuestion.options.some((opt) => !opt)) {
      setError('Please fill in all question fields');
      return;
    }

    setQuestions((prev) => [...prev, { ...currentQuestion }]);
    setCurrentQuestion({
      text: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      timeLimit: 30,
      points: 10,
    });
    setError('');
  };

  const removeQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (questions.length === 0) {
      setError('Please add at least one question');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const quizData: Omit<Quiz, 'id'> = {
        title: quizDetails.title,
        description: quizDetails.description,
        type: quizDetails.type,
        entryFee: quizDetails.entryFee,
        startTime: new Date(quizDetails.startTime),
        duration: quizDetails.duration,
        questions: questions.map((q, index) => ({ ...q, id: String(index) })),
        participants: [],
        prizeMoney: quizDetails.prizeMoney,
        isActive: true,
      };

      await addDoc(collection(db, 'quizzes'), quizData);
      router.push('/admin');
    } catch (error) {
      setError('Error creating quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 py-8">
      <div className="container mx-auto px-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Create New Quiz</h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Quiz Details */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-white">Quiz Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={quizDetails.title}
                    onChange={handleQuizDetailsChange}
                    className="w-full bg-white/10 border border-white/20 rounded-md px-4 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Type
                  </label>
                  <select
                    name="type"
                    value={quizDetails.type}
                    onChange={handleQuizDetailsChange}
                    className="w-full bg-white/10 border border-white/20 rounded-md px-4 py-2 text-white"
                  >
                    <option value="free">Free</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    name="startTime"
                    required
                    value={quizDetails.startTime}
                    onChange={handleQuizDetailsChange}
                    className="w-full bg-white/10 border border-white/20 rounded-md px-4 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    name="duration"
                    required
                    min="1"
                    value={quizDetails.duration}
                    onChange={handleQuizDetailsChange}
                    className="w-full bg-white/10 border border-white/20 rounded-md px-4 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  required
                  value={quizDetails.description}
                  onChange={handleQuizDetailsChange}
                  rows={3}
                  className="w-full bg-white/10 border border-white/20 rounded-md px-4 py-2 text-white"
                />
              </div>

              {quizDetails.type === 'paid' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Entry Fee (₹)
                    </label>
                    <input
                      type="number"
                      name="entryFee"
                      required
                      min="0"
                      value={quizDetails.entryFee}
                      onChange={handleQuizDetailsChange}
                      className="w-full bg-white/10 border border-white/20 rounded-md px-4 py-2 text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {['First', 'Second', 'Third'].map((place, index) => (
                      <div key={place}>
                        <label className="block text-sm font-medium text-white mb-2">
                          {place} Prize (₹)
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={quizDetails.prizeMoney[index]}
                          onChange={(e) => handlePrizeMoneyChange(index, e.target.value)}
                          className="w-full bg-white/10 border border-white/20 rounded-md px-4 py-2 text-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Questions Section */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-white">Questions</h2>

              {/* Question List */}
              {questions.length > 0 && (
                <div className="space-y-4 mb-8">
                  {questions.map((question, index) => (
                    <div
                      key={index}
                      className="bg-white/5 rounded-lg p-4 flex justify-between items-start"
                    >
                      <div className="text-white">
                        <div className="font-medium">Question {index + 1}</div>
                        <div className="text-white/80">{question.text}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeQuestion(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Question Form */}
              <div className="bg-white/5 rounded-lg p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Question Text
                  </label>
                  <textarea
                    name="text"
                    value={currentQuestion.text}
                    onChange={handleQuestionChange}
                    rows={2}
                    className="w-full bg-white/10 border border-white/20 rounded-md px-4 py-2 text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentQuestion.options.map((option, index) => (
                    <div key={index}>
                      <label className="block text-sm font-medium text-white mb-2">
                        Option {index + 1}
                        {index === currentQuestion.correctAnswer && (
                          <span className="ml-2 text-green-400">(Correct)</span>
                        )}
                      </label>
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-md px-4 py-2 text-white"
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Correct Answer
                    </label>
                    <select
                      name="correctAnswer"
                      value={currentQuestion.correctAnswer}
                      onChange={handleQuestionChange}
                      className="w-full bg-white/10 border border-white/20 rounded-md px-4 py-2 text-white"
                    >
                      {[0, 1, 2, 3].map((num) => (
                        <option key={num} value={num}>
                          Option {num + 1}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Time Limit (seconds)
                    </label>
                    <input
                      type="number"
                      name="timeLimit"
                      min="5"
                      value={currentQuestion.timeLimit}
                      onChange={handleQuestionChange}
                      className="w-full bg-white/10 border border-white/20 rounded-md px-4 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Points
                    </label>
                    <input
                      type="number"
                      name="points"
                      min="1"
                      value={currentQuestion.points}
                      onChange={handleQuestionChange}
                      className="w-full bg-white/10 border border-white/20 rounded-md px-4 py-2 text-white"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addQuestion}
                  className="w-full bg-white/10 text-white py-2 rounded-full hover:bg-white/20 transition-colors"
                >
                  Add Question
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push('/admin')}
                className="px-6 py-2 rounded-full text-white bg-white/10 hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 rounded-full bg-white text-indigo-600 hover:bg-indigo-100 transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating Quiz...' : 'Create Quiz'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
