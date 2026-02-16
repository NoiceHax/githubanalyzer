import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { analyzeUser, PortfolioAnalysis, enhancePortfolio, PortfolioEnhancement } from '../services/api';
import {
  Github,
  ArrowLeft,
  Star,
  GitFork,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Loader2,
  Lock
} from 'lucide-react';

export default function Dashboard() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<PortfolioAnalysis | null>(null);
  const [enhancement, setEnhancement] = useState<PortfolioEnhancement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEnhancement, setShowEnhancement] = useState(false);

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!username) return;

      setLoading(true);
      setError(null);

      try {
        const data = await analyzeUser(username);
        setAnalysis(data);
      } catch (err) {
        setError('Failed to analyze user. Please check the username and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [username]);

  const handleLoadEnhancement = async () => {
    if (!username || enhancement) return;

    try {
      const data = await enhancePortfolio(username);
      setEnhancement(data);
      setShowEnhancement(true);
    } catch (err) {
      console.error('Failed to load enhancement suggestions');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityBadge = (quality: string) => {
    const colors: Record<string, string> = {
      excellent: 'bg-green-100 text-green-800',
      good: 'bg-blue-100 text-blue-800',
      basic: 'bg-yellow-100 text-yellow-800',
      minimal: 'bg-orange-100 text-orange-800',
      none: 'bg-red-100 text-red-800',
    };
    return colors[quality] || colors.none;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-gray-900 mx-auto mb-4" />
          <p className="text-gray-600">Analyzing portfolio...</p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Analysis Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>
            <a
              href={analysis.profile_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-900 hover:text-gray-700 transition"
            >
              <Github className="w-5 h-5" />
              <span className="font-medium">View on GitHub</span>
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {analysis.username}'s Portfolio
          </h1>
          <p className="text-gray-600">
            {analysis.total_repos} repositories • {analysis.total_stars} total stars
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gray-50 mb-4">
              <span className={`text-5xl font-bold ${getScoreColor(analysis.overall_score)}`}>
                {analysis.overall_score}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Overall Score</h2>
            <p className="text-gray-600 text-sm">Portfolio quality rating</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">Strengths</h2>
            </div>
            <ul className="space-y-2">
              {analysis.strengths.map((strength, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
              <h2 className="text-xl font-semibold text-gray-900">Areas to Improve</h2>
            </div>
            <ul className="space-y-2">
              {analysis.weaknesses.map((weakness, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-yellow-600 mt-1">•</span>
                  <span>{weakness}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Recommendations</h2>
            </div>
            <button
              onClick={handleLoadEnhancement}
              className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition"
            >
              {showEnhancement ? 'Hide' : 'View'} Enhanced Plan
            </button>
          </div>
          <ul className="space-y-3">
            {analysis.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="font-semibold text-blue-600 mt-0.5">{idx + 1}.</span>
                <span className="text-gray-700">{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        {showEnhancement && enhancement && (
          <div className="bg-gradient-to-br from-blue-50 to-gray-50 rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Enhanced Action Plan</h2>
            <div className="mb-4 p-4 bg-white rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Current Score</p>
                  <p className="text-3xl font-bold text-gray-900">{enhancement.current_score}</p>
                </div>
                <div className="text-gray-400 text-2xl">→</div>
                <div>
                  <p className="text-sm text-gray-600">Potential Score</p>
                  <p className="text-3xl font-bold text-green-600">{enhancement.potential_score}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4">
                <h3 className="font-semibold text-green-600 mb-3">Quick Wins</h3>
                <div className="space-y-3">
                  {enhancement.suggestions.quick_wins.map((item, idx) => (
                    <div key={idx} className="border-l-2 border-green-600 pl-3">
                      <p className="font-medium text-gray-900 text-sm">{item.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg p-4">
                <h3 className="font-semibold text-blue-600 mb-3">Medium Term</h3>
                <div className="space-y-3">
                  {enhancement.suggestions.medium_term.map((item, idx) => (
                    <div key={idx} className="border-l-2 border-blue-600 pl-3">
                      <p className="font-medium text-gray-900 text-sm">{item.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg p-4">
                <h3 className="font-semibold text-gray-600 mb-3">Long Term</h3>
                <div className="space-y-3">
                  {enhancement.suggestions.long_term.map((item, idx) => (
                    <div key={idx} className="border-l-2 border-gray-600 pl-3">
                      <p className="font-medium text-gray-900 text-sm">{item.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Repositories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {analysis.repositories.map((repo) => (
              <div
                key={repo.name}
                onClick={() => navigate(`/repo/${analysis.username}/${repo.name}`)}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 text-lg">{repo.name}</h3>
                    {repo.is_private && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-800 text-white text-xs rounded-full font-medium">
                        <Lock className="w-3 h-3" />
                        Private
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-medium">{repo.stars}</span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {repo.description || 'No description available'}
                </p>

                <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <GitFork className="w-4 h-4" />
                    <span>{repo.forks}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{repo.open_issues}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(repo.languages).slice(0, 3).map((lang) => (
                      <span
                        key={lang}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded font-medium ${getQualityBadge(
                      repo.readme_quality
                    )}`}
                  >
                    {repo.readme_quality}
                  </span>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Health Score</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${repo.health_score >= 80
                              ? 'bg-green-600'
                              : repo.health_score >= 60
                                ? 'bg-blue-600'
                                : repo.health_score >= 40
                                  ? 'bg-yellow-600'
                                  : 'bg-red-600'
                            }`}
                          style={{ width: `${repo.health_score}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-700">
                        {repo.health_score}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
