import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Github, Search } from 'lucide-react';

export default function Homepage() {
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      navigate(`/dashboard/${username.trim()}`);
    }
  };

  const handleExampleClick = (exampleUsername: string) => {
    navigate(`/dashboard/${exampleUsername}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-900 rounded-2xl mb-6 shadow-lg">
            <Github className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            GitHub Portfolio Analyzer
          </h1>
          <p className="text-xl text-gray-600">
            Analyze any GitHub profile and get actionable insights to enhance your portfolio
          </p>
        </div>

        <form onSubmit={handleAnalyze} className="mb-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-3">
              GitHub Username
            </label>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition"
                  required
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              <button
                type="submit"
                className="px-8 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition shadow-md hover:shadow-lg"
              >
                Analyze
              </button>
            </div>
          </div>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600 mb-4">Try these examples:</p>
          <div className="flex flex-wrap justify-center gap-3">
            {['torvalds', 'gaearon', 'tj', 'sindresorhus'].map((example) => (
              <button
                key={example}
                onClick={() => handleExampleClick(example)}
                className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition shadow-sm border border-gray-200"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-semibold text-gray-900 mb-2">Portfolio Analysis</h3>
            <p className="text-sm text-gray-600">
              Get a comprehensive score and detailed insights about your GitHub presence
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-3">💡</div>
            <h3 className="font-semibold text-gray-900 mb-2">Smart Suggestions</h3>
            <p className="text-sm text-gray-600">
              Receive actionable recommendations to improve your repositories
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-3">✨</div>
            <h3 className="font-semibold text-gray-900 mb-2">README Enhancer</h3>
            <p className="text-sm text-gray-600">
              Generate professional README templates for better documentation
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
