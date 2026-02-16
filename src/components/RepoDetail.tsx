import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { analyzeRepo, enhanceREADME, RepoDetail as RepoDetailType, READMEEnhanceResponse } from '../services/api';
import {
  ArrowLeft,
  Star,
  GitFork,
  AlertCircle,
  ExternalLink,
  Calendar,
  Code,
  Loader2,
  FileText,
  Copy,
  Check,
  Sparkles
} from 'lucide-react';

export default function RepoDetail() {
  const { username, repo } = useParams<{ username: string; repo: string }>();
  const navigate = useNavigate();
  const [repoData, setRepoData] = useState<RepoDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEnhancedREADME, setShowEnhancedREADME] = useState(false);
  const [enhancedData, setEnhancedData] = useState<READMEEnhanceResponse | null>(null);
  const [enhancing, setEnhancing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchRepo = async () => {
      if (!username || !repo) return;

      setLoading(true);
      setError(null);

      try {
        const data = await analyzeRepo(username, repo);
        setRepoData(data);
      } catch (err) {
        setError('Failed to analyze repository');
      } finally {
        setLoading(false);
      }
    };

    fetchRepo();
  }, [username, repo]);

  const handleEnhanceREADME = async () => {
    if (!repoData || enhancing) return;

    setEnhancing(true);
    try {
      const data = await enhanceREADME(repoData.readme_content, repoData.name);
      setEnhancedData(data);
      setShowEnhancedREADME(true);
    } catch (err) {
      console.error('Failed to enhance README');
    } finally {
      setEnhancing(false);
    }
  };

  const handleCopyREADME = () => {
    if (!enhancedData) return;

    navigator.clipboard.writeText(enhancedData.enhanced_readme);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getQualityColor = (quality: string) => {
    const colors: Record<string, string> = {
      excellent: 'text-green-600 bg-green-100',
      good: 'text-blue-600 bg-blue-100',
      basic: 'text-yellow-600 bg-yellow-100',
      minimal: 'text-orange-600 bg-orange-100',
      none: 'text-red-600 bg-red-100',
    };
    return colors[quality] || colors.none;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-gray-900 mx-auto mb-4" />
          <p className="text-gray-600">Analyzing repository...</p>
        </div>
      </div>
    );
  }

  if (error || !repoData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Analysis Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const totalLanguageBytes = Object.values(repoData.languages).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>
            <a
              href={repoData.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-900 hover:text-gray-700 transition"
            >
              <ExternalLink className="w-5 h-5" />
              <span className="font-medium">View on GitHub</span>
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{repoData.name}</h1>
          <p className="text-gray-600 text-lg">{repoData.description || 'No description available'}</p>
          {repoData.homepage && (
            <a
              href={repoData.homepage}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mt-2"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Live Demo</span>
            </a>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-gray-900">{repoData.stars}</p>
            <p className="text-sm text-gray-600">Stars</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <GitFork className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-gray-900">{repoData.forks}</p>
            <p className="text-sm text-gray-600">Forks</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <AlertCircle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-gray-900">{repoData.open_issues}</p>
            <p className="text-sm text-gray-600">Open Issues</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <Calendar className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-900">
              {new Date(repoData.updated_at).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-600">Last Updated</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <Code className="w-6 h-6 text-gray-900" />
              <h2 className="text-xl font-semibold text-gray-900">Languages</h2>
            </div>
            <div className="space-y-3">
              {Object.entries(repoData.languages).map(([lang, bytes]) => {
                const percentage = ((bytes / totalLanguageBytes) * 100).toFixed(1);
                return (
                  <div key={lang}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{lang}</span>
                      <span className="text-gray-600">{percentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gray-900"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-6 h-6 text-gray-900" />
              <h2 className="text-xl font-semibold text-gray-900">README Analysis</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Status:</span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getQualityColor(
                    repoData.readme_analysis.quality
                  )}`}
                >
                  {repoData.readme_analysis.has_readme
                    ? repoData.readme_analysis.quality
                    : 'No README'}
                </span>
              </div>

              {repoData.readme_analysis.missing_sections.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Missing Sections:</p>
                  <div className="flex flex-wrap gap-2">
                    {repoData.readme_analysis.missing_sections.map((section) => (
                      <span
                        key={section}
                        className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded"
                      >
                        {section}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleEnhanceREADME}
                disabled={enhancing}
                className="w-full mt-4 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {enhancing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Enhancing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Generate Enhanced README</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {showEnhancedREADME && enhancedData && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Enhanced README</h2>
              <button
                onClick={handleCopyREADME}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Improvements:</h3>
              <ul className="space-y-1">
                {enhancedData.improvements.map((imp, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gray-900 rounded-lg p-6 overflow-x-auto">
              <pre className="text-sm text-gray-100 whitespace-pre-wrap">
                {enhancedData.enhanced_readme}
              </pre>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Improvement Suggestions</h2>
          <ul className="space-y-3">
            {repoData.suggestions.map((suggestion, idx) => (
              <li key={idx} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <span className="font-semibold text-blue-600 mt-0.5">{idx + 1}.</span>
                <span className="text-gray-700">{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>

        {repoData.recent_commits.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {repoData.recent_commits.map((commit, idx) => (
                <div key={idx} className="border-l-2 border-gray-300 pl-4 py-2">
                  <p className="font-medium text-gray-900">{commit.message}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    <span>{commit.author}</span>
                    <span>•</span>
                    <span>{new Date(commit.date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
