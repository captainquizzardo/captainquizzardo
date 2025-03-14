'use client';

import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
  category: 'general' | 'quiz' | 'payment' | 'technical';
}

const faqs: FAQItem[] = [
  {
    category: 'general',
    question: 'What is Captain Quizzardo?',
    answer: 'Captain Quizzardo is an online quiz platform where you can participate in both free and paid quizzes. Test your knowledge, compete with others, and win exciting prizes!'
  },
  {
    category: 'general',
    question: 'How do I get started?',
    answer: 'Simply sign up using your email or phone number, verify your account, and you can start participating in quizzes right away. We recommend trying our free practice quizzes first to get familiar with the platform.'
  },
  {
    category: 'quiz',
    question: 'What types of quizzes are available?',
    answer: 'We offer both free and paid quizzes. Free quizzes are great for practice, while paid quizzes offer cash prizes for top performers. Quiz categories include General Knowledge, Sports, Science, History, and more.'
  },
  {
    category: 'quiz',
    question: 'How long does each quiz last?',
    answer: 'Quiz duration varies, but typically ranges from 15 to 30 minutes. Each question has its own time limit, usually between 30-60 seconds.'
  },
  {
    category: 'quiz',
    question: 'How is scoring calculated?',
    answer: 'Points are awarded based on correct answers and the time taken to answer. Quick, correct answers earn more points. The exact points per question are displayed during the quiz.'
  },
  {
    category: 'payment',
    question: 'How do paid quizzes work?',
    answer: 'Paid quizzes require an entry fee and offer cash prizes for top performers. The prize pool is distributed among the top 3 winners. Entry fees and prize amounts are clearly displayed before joining.'
  },
  {
    category: 'payment',
    question: 'What payment methods are accepted?',
    answer: 'We accept payments through UPI (PhonePe, Google Pay), debit/credit cards, and net banking. All transactions are secure and processed through trusted payment gateways.'
  },
  {
    category: 'payment',
    question: 'How do I withdraw my winnings?',
    answer: 'Winnings can be withdrawn to your linked bank account once they exceed the minimum withdrawal amount (₹100). Withdrawals are processed within 24-48 hours.'
  },
  {
    category: 'technical',
    question: 'What devices can I use to play?',
    answer: 'Captain Quizzardo works on all modern devices including smartphones, tablets, and computers. We recommend using the latest version of Chrome, Firefox, or Safari.'
  },
  {
    category: 'technical',
    question: 'What happens if I lose internet connection during a quiz?',
    answer: 'Our system automatically saves your progress. You can resume from where you left off if you reconnect within the quiz duration. However, the question timer continues running.'
  },
  {
    category: 'technical',
    question: 'How do you prevent cheating?',
    answer: 'We employ various anti-cheating measures including time limits, question randomization, and advanced user behavior monitoring. Any form of cheating will result in immediate disqualification.'
  },
  {
    category: 'general',
    question: 'How can I contact support?',
    answer: 'You can reach our support team through the contact form in your dashboard, or email us at support@captainquizzardo.com. We typically respond within 24 hours.'
  }
];

export default function FAQPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());

  const toggleQuestion = (index: number) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedQuestions(newExpanded);
  };

  const filteredFAQs = faqs.filter((faq) => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Frequently Asked Questions
            </h1>
            <p className="text-white/80">
              Find answers to common questions about Captain Quizzardo
            </p>
          </div>

          {/* Search and Filters */}
          <div className="space-y-4 mb-8">
            <div>
              <input
                type="text"
                placeholder="Search FAQ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {['all', 'general', 'quiz', 'payment', 'technical'].map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    selectedCategory === category
                      ? 'bg-white text-indigo-600'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* FAQ List */}
          <div className="space-y-4">
            {filteredFAQs.length === 0 ? (
              <div className="text-center text-white py-8">
                No FAQs found matching your criteria.
              </div>
            ) : (
              filteredFAQs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white/5 rounded-lg overflow-hidden border border-white/10"
                >
                  <button
                    onClick={() => toggleQuestion(index)}
                    className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-white/5"
                  >
                    <span className="text-white font-medium">{faq.question}</span>
                    <span className="text-white ml-4">
                      {expandedQuestions.has(index) ? '−' : '+'}
                    </span>
                  </button>
                  {expandedQuestions.has(index) && (
                    <div className="px-6 py-4 bg-white/5 text-white/80">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Contact Support */}
          <div className="mt-12 text-center">
            <p className="text-white/80 mb-4">
              Can't find what you're looking for?
            </p>
            <a
              href="mailto:support@captainquizzardo.com"
              className="inline-block bg-white text-indigo-600 px-6 py-2 rounded-full font-medium hover:bg-indigo-100 transition-colors"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
