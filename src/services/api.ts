const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface RepoAnalysis {
  name: string;
  description: string | null;
  languages: Record<string, number>;
  stars: number;
  forks: number;
  open_issues: number;
  last_updated: string;
  has_readme: boolean;
  readme_quality: string;
  health_score: number;
  url: string;
  is_private: boolean;
}

export interface PortfolioAnalysis {
  username: string;
  overall_score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  repositories: RepoAnalysis[];
  total_repos: number;
  total_stars: number;
  profile_url: string;
}

export interface RepoDetail {
  name: string;
  description: string | null;
  stars: number;
  forks: number;
  open_issues: number;
  watchers: number;
  languages: Record<string, number>;
  created_at: string;
  updated_at: string;
  homepage: string | null;
  url: string;
  readme_analysis: {
    has_readme: boolean;
    quality: string;
    missing_sections: string[];
  };
  recent_commits: Array<{
    message: string;
    date: string;
    author: string;
  }>;
  suggestions: string[];
  readme_content: string;
}

export interface EnhancedREADME {
  enhanced_readme: string;
  improvements: string[];
}

export interface EnhancedPortfolio {
  current_score: number;
  potential_score: number;
  suggestions: {
    quick_wins: Array<{ title: string; description: string; impact: string }>;
    medium_term: Array<{ title: string; description: string; impact: string }>;
    long_term: Array<{ title: string; description: string; impact: string }>;
  };
  priority_actions: string[];
}

export const analyzeUser = async (username: string): Promise<PortfolioAnalysis> => {
  const response = await fetch(`${API_BASE}/analyze/${username}`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }
  return response.json();
};

export const analyzeRepo = async (username: string, repo: string): Promise<RepoDetail> => {
  const response = await fetch(`${API_BASE}/repo/${username}/${repo}`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }
  return response.json();
};

export const enhanceREADME = async (content: string, repoName: string): Promise<EnhancedREADME> => {
  const response = await fetch(`${API_BASE}/enhance/readme`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, repo_name: repoName }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }
  return response.json();
};

export const enhancePortfolio = async (username: string): Promise<EnhancedPortfolio> => {
  const response = await fetch(`${API_BASE}/enhance/portfolio?username=${username}`, {
    method: 'POST',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }
  return response.json();
};

// Backward-compat alias used by Dashboard
export type PortfolioEnhancement = EnhancedPortfolio;
