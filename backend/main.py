from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Optional
from datetime import datetime, timezone
from pydantic import BaseModel
import httpx
import os
import logging
from dotenv import load_dotenv
import base64

load_dotenv()

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("portfolio-analyzer")

# ---------------------------------------------------------------------------
# App & CORS
# ---------------------------------------------------------------------------
app = FastAPI(title="GitHub Portfolio Analyzer")

ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info("CORS allowed origins: %s", ALLOWED_ORIGINS)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
GITHUB_API_BASE = "https://api.github.com"
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
HTTP_TIMEOUT = 15.0  # seconds


# Models
class RepoAnalysis(BaseModel):
    name: str
    description: Optional[str]
    languages: Dict[str, int]
    stars: int
    forks: int
    open_issues: int
    last_updated: str
    has_readme: bool
    readme_quality: str
    health_score: int
    url: str
    is_private: bool = False


class PortfolioAnalysis(BaseModel):
    username: str
    overall_score: int
    strengths: List[str]
    weaknesses: List[str]
    recommendations: List[str]
    repositories: List[RepoAnalysis]
    total_repos: int
    total_stars: int
    profile_url: str


class READMEEnhanceRequest(BaseModel):
    content: str
    repo_name: str


class READMEEnhanceResponse(BaseModel):
    enhanced_readme: str
    improvements: List[str]


# GitHub API Helper
async def fetch_github_data(url: str) -> Dict:
    headers = {"Accept": "application/vnd.github.v3+json"}
    if GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"
    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
        response = await client.get(url, headers=headers)
        if response.status_code == 404:
            raise HTTPException(status_code=404, detail="User or repository not found")
        if response.status_code == 403:
            raise HTTPException(status_code=429, detail="GitHub API rate limit exceeded. Please add a GITHUB_TOKEN to your .env file.")
        response.raise_for_status()
        return response.json()


async def fetch_all_repos_paginated(url: str, params: Dict = None) -> List[Dict]:
    """Fetch all pages of repos from a GitHub API endpoint."""
    headers = {"Accept": "application/vnd.github.v3+json"}
    if GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"

    all_repos = []
    page = 1
    if params is None:
        params = {}

    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
        while True:
            params["page"] = page
            params["per_page"] = 100
            response = await client.get(url, headers=headers, params=params)
            if response.status_code not in (200, ):
                break
            repos = response.json()
            if not repos:
                break
            all_repos.extend(repos)
            if len(repos) < 100:
                break
            page += 1

    return all_repos


async def fetch_private_repos(owner_username: str) -> List[Dict]:
    """
    Fetch private repos via /user/repos (authenticated user endpoint).
    Only returns results when the token owner matches the requested username.
    Returns an empty list on auth errors or mismatched users (non-fatal).
    """
    if not GITHUB_TOKEN:
        return []

    try:
        repos = await fetch_all_repos_paginated(
            f"{GITHUB_API_BASE}/user/repos",
            params={"visibility": "private", "affiliation": "owner"}
        )
        # Only keep repos that belong to the requested username
        return [
            r for r in repos
            if r.get("owner", {}).get("login", "").lower() == owner_username.lower()
               and r.get("private") is True
        ]
    except Exception as e:
        logger.warning("Failed to fetch private repos for %s: %s", owner_username, e)
        return []


def calculate_readme_quality(readme_content: str) -> str:
    if not readme_content:
        return "none"

    score = 0
    sections = ["installation", "usage", "setup", "example", "screenshot", "demo", "contributing"]
    readme_lower = readme_content.lower()

    for section in sections:
        if section in readme_lower:
            score += 1

    if score >= 5:
        return "excellent"
    elif score >= 3:
        return "good"
    elif score >= 1:
        return "basic"
    else:
        return "minimal"


def calculate_repo_health(repo: Dict, has_readme: bool, readme_quality: str) -> int:
    score = 0

    # README quality
    if has_readme:
        score += 20
        quality_scores = {"excellent": 20, "good": 15, "basic": 10, "minimal": 5, "none": 0}
        score += quality_scores.get(readme_quality, 0)

    # Description
    if repo.get("description"):
        score += 10

    # Stars
    if repo.get("stargazers_count", 0) > 0:
        score += min(repo["stargazers_count"] * 2, 20)

    # Issues enabled
    if repo.get("has_issues"):
        score += 5

    # Recent activity
    days_since_update = (datetime.now(timezone.utc) - datetime.fromisoformat(
        repo["updated_at"].replace("Z", "+00:00")
    )).days

    if days_since_update < 30:
        score += 15
    elif days_since_update < 90:
        score += 10
    elif days_since_update < 180:
        score += 5

    return min(score, 100)


def analyze_portfolio(user_data: Dict, repos: List[Dict], repos_analysis: List[RepoAnalysis]) -> PortfolioAnalysis:
    strengths = []
    weaknesses = []
    recommendations = []

    total_stars = sum(r.stars for r in repos_analysis)
    avg_health = sum(r.health_score for r in repos_analysis) / len(repos_analysis) if repos_analysis else 0
    repos_with_readme = sum(1 for r in repos_analysis if r.has_readme)
    readme_percentage = (repos_with_readme / len(repos_analysis) * 100) if repos_analysis else 0

    # Strengths
    if total_stars > 50:
        strengths.append(f"Strong community engagement with {total_stars} total stars")
    elif total_stars > 10:
        strengths.append(f"Growing community presence with {total_stars} stars")

    if readme_percentage > 80:
        strengths.append(f"Excellent documentation coverage ({readme_percentage:.0f}% of repos have READMEs)")
    elif readme_percentage > 50:
        strengths.append(f"Good documentation practices ({readme_percentage:.0f}% have READMEs)")

    active_repos = sum(1 for r in repos if (datetime.now(timezone.utc) - datetime.fromisoformat(
        r["updated_at"].replace("Z", "+00:00")
    )).days < 90)

    if active_repos > len(repos) * 0.5:
        strengths.append(f"Active developer with {active_repos} recently updated repositories")

    all_languages = set()
    for r in repos_analysis:
        all_languages.update(r.languages.keys())

    if len(all_languages) > 5:
        strengths.append(f"Diverse technical stack across {len(all_languages)} languages")

    # Weaknesses
    if readme_percentage < 50:
        weaknesses.append("Many repositories lack proper documentation")
        recommendations.append("Add comprehensive READMEs to all major projects")

    if total_stars < 10:
        weaknesses.append("Limited community engagement")
        recommendations.append("Promote projects on social media and developer communities")

    if active_repos < len(repos) * 0.3:
        weaknesses.append("Several projects appear inactive")
        recommendations.append("Archive inactive projects or add maintenance status badges")

    repos_without_description = sum(1 for r in repos_analysis if not r.description)
    if repos_without_description > len(repos_analysis) * 0.3:
        weaknesses.append("Many repositories lack descriptions")
        recommendations.append("Add clear, concise descriptions to all repositories")

    # General recommendations
    if len(repos_analysis) < 5:
        recommendations.append("Build more diverse projects to showcase your skills")

    if "JavaScript" not in all_languages and "TypeScript" not in all_languages:
        recommendations.append("Consider adding web development projects to broaden your portfolio")

    recommendations.append("Add live demos or screenshots to showcase your work")
    recommendations.append("Ensure all repos have proper licenses")

    # Calculate overall score
    overall_score = int(avg_health * 0.6 + (readme_percentage / 100) * 20 + min(total_stars, 20))

    return PortfolioAnalysis(
        username=user_data["login"],
        overall_score=min(overall_score, 100),
        strengths=strengths,
        weaknesses=weaknesses,
        recommendations=recommendations,
        repositories=repos_analysis,
        total_repos=len(repos_analysis),
        total_stars=total_stars,
        profile_url=user_data["html_url"]
    )


@app.get("/")
async def root():
    return {"message": "GitHub Portfolio Analyzer API", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/analyze/{username}", response_model=PortfolioAnalysis)
async def analyze_user(username: str):
    try:
        user_data = await fetch_github_data(f"{GITHUB_API_BASE}/users/{username}")
        public_repos = await fetch_github_data(f"{GITHUB_API_BASE}/users/{username}/repos?per_page=100&sort=updated")

        # Fetch private repos and merge (deduplicate by repo id)
        private_repos = await fetch_private_repos(username)
        seen_ids = {r["id"] for r in public_repos}
        for pr in private_repos:
            if pr["id"] not in seen_ids:
                public_repos.append(pr)
                seen_ids.add(pr["id"])

        repos = public_repos

        repos_analysis = []
        for repo in repos[:20]:
            if repo.get("fork"):
                continue

            # Get languages
            languages = {}
            try:
                languages = await fetch_github_data(repo["languages_url"])
            except Exception as e:
                logger.warning("Failed to fetch languages for %s: %s", repo["name"], e)

            # Get README
            readme_content = ""
            has_readme = False
            try:
                readme_data = await fetch_github_data(
                    f"{GITHUB_API_BASE}/repos/{username}/{repo['name']}/readme"
                )
                readme_content = base64.b64decode(readme_data.get("content", "")).decode("utf-8")
                has_readme = True
            except Exception as e:
                logger.debug("No README for %s: %s", repo["name"], e)

            readme_quality = calculate_readme_quality(readme_content)
            health_score = calculate_repo_health(repo, has_readme, readme_quality)

            repos_analysis.append(RepoAnalysis(
                name=repo["name"],
                description=repo.get("description"),
                languages=languages,
                stars=repo.get("stargazers_count", 0),
                forks=repo.get("forks_count", 0),
                open_issues=repo.get("open_issues_count", 0),
                last_updated=repo["updated_at"],
                has_readme=has_readme,
                readme_quality=readme_quality,
                health_score=health_score,
                url=repo["html_url"],
                is_private=repo.get("private", False)
            ))

        return analyze_portfolio(user_data, repos, repos_analysis)

    except HTTPException:
        raise
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=str(e))
    except Exception as e:
        logger.exception("Error analysing user %s", username)
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/repo/{username}/{repo_name}")
async def analyze_repo(username: str, repo_name: str):
    try:
        repo_data = await fetch_github_data(f"{GITHUB_API_BASE}/repos/{username}/{repo_name}")
        languages = await fetch_github_data(repo_data["languages_url"])

        # README analysis
        readme_content = ""
        readme_analysis = {
            "has_readme": False,
            "quality": "none",
            "missing_sections": []
        }

        try:
            readme_data = await fetch_github_data(
                f"{GITHUB_API_BASE}/repos/{username}/{repo_name}/readme"
            )
            readme_content = base64.b64decode(readme_data.get("content", "")).decode("utf-8")
            readme_analysis["has_readme"] = True
            readme_analysis["quality"] = calculate_readme_quality(readme_content)

            # Check missing sections
            required_sections = [
                ("Overview/Description", ["overview", "about", "description"]),
                ("Installation", ["installation", "install", "setup"]),
                ("Usage", ["usage", "example", "how to"]),
                ("Tech Stack", ["tech", "technology", "built with"]),
                ("Screenshots/Demo", ["screenshot", "demo", "preview"])
            ]

            readme_lower = readme_content.lower()
            for section_name, keywords in required_sections:
                if not any(kw in readme_lower for kw in keywords):
                    readme_analysis["missing_sections"].append(section_name)
        except Exception as e:
            logger.debug("No README found for %s/%s: %s", username, repo_name, e)
            readme_analysis["missing_sections"] = [
                "Overview/Description", "Installation", "Usage",
                "Tech Stack", "Screenshots/Demo"
            ]

        # Recent commits
        commits = []
        try:
            commits_data = await fetch_github_data(
                f"{GITHUB_API_BASE}/repos/{username}/{repo_name}/commits?per_page=10"
            )
            commits = [
                {
                    "message": c["commit"]["message"],
                    "date": c["commit"]["author"]["date"],
                    "author": c["commit"]["author"]["name"]
                }
                for c in commits_data
            ]
        except Exception as e:
            logger.warning("Failed to fetch commits for %s/%s: %s", username, repo_name, e)

        # Generate suggestions
        suggestions = []
        if not repo_data.get("description"):
            suggestions.append("Add a clear, concise description to your repository")
        if not readme_analysis["has_readme"]:
            suggestions.append("Create a comprehensive README.md file")
        elif readme_analysis["missing_sections"]:
            suggestions.append(f"Add missing README sections: {', '.join(readme_analysis['missing_sections'])}")
        if repo_data.get("stargazers_count", 0) == 0:
            suggestions.append("Promote your project to gain stars and visibility")
        if not repo_data.get("homepage"):
            suggestions.append("Add a live demo URL if applicable")
        if repo_data.get("open_issues_count", 0) > 10:
            suggestions.append("Address open issues to improve project health")

        days_since_update = (datetime.now(timezone.utc) - datetime.fromisoformat(
            repo_data["updated_at"].replace("Z", "+00:00")
        )).days
        if days_since_update > 180:
            suggestions.append("Update the repository or archive it if no longer maintained")

        return {
            "name": repo_data["name"],
            "description": repo_data.get("description"),
            "stars": repo_data.get("stargazers_count", 0),
            "forks": repo_data.get("forks_count", 0),
            "open_issues": repo_data.get("open_issues_count", 0),
            "watchers": repo_data.get("watchers_count", 0),
            "languages": languages,
            "created_at": repo_data["created_at"],
            "updated_at": repo_data["updated_at"],
            "homepage": repo_data.get("homepage"),
            "url": repo_data["html_url"],
            "readme_analysis": readme_analysis,
            "recent_commits": commits,
            "suggestions": suggestions,
            "readme_content": readme_content
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error analysing repo %s/%s", username, repo_name)
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/enhance/readme", response_model=READMEEnhanceResponse)
async def enhance_readme(request: READMEEnhanceRequest):
    current = request.content
    repo_name = request.repo_name

    enhanced = f"""# {repo_name}

## Overview
[Provide a brief description of what this project does and why it exists]

## Features
- Feature 1
- Feature 2
- Feature 3

## Tech Stack
- Technology 1
- Technology 2
- Technology 3

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/{repo_name}.git

# Navigate to project directory
cd {repo_name}

# Install dependencies
npm install  # or your package manager
```

## Usage

```bash
# Run the application
npm start
```

### Example

```javascript
// Add code examples here
```

## Screenshots

![Screenshot 1](link-to-screenshot)

## Live Demo

[View Live Demo](your-demo-url)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

Your Name - [@yourhandle](https://twitter.com/yourhandle)

Project Link: [https://github.com/yourusername/{repo_name}](https://github.com/yourusername/{repo_name})
"""

    improvements = [
        "Added comprehensive project overview section",
        "Included installation and setup instructions",
        "Added usage examples and code snippets",
        "Included sections for screenshots and live demo",
        "Added tech stack documentation",
        "Included contributing guidelines",
        "Added contact and license information"
    ]

    if current:
        improvements.append("Enhanced existing content with better structure")

    return READMEEnhanceResponse(
        enhanced_readme=enhanced,
        improvements=improvements
    )


@app.post("/enhance/portfolio")
async def enhance_portfolio(username: str):
    try:
        analysis = await analyze_user(username)

        enhanced_suggestions = {
            "quick_wins": [],
            "medium_term": [],
            "long_term": []
        }

        if analysis.total_stars < 50:
            enhanced_suggestions["quick_wins"].append({
                "title": "Promote Your Best Projects",
                "description": "Share your top 3 projects on LinkedIn, Twitter, and Reddit communities",
                "impact": "high"
            })

        repos_without_readme = sum(1 for r in analysis.repositories if not r.has_readme)
        if repos_without_readme > 0:
            enhanced_suggestions["quick_wins"].append({
                "title": f"Add READMEs to {repos_without_readme} Repositories",
                "description": "Start with your most starred projects and add comprehensive documentation",
                "impact": "high"
            })

        enhanced_suggestions["medium_term"].append({
            "title": "Create a Portfolio Website",
            "description": "Build a personal website showcasing your best projects with live demos",
            "impact": "high"
        })

        enhanced_suggestions["medium_term"].append({
            "title": "Add Project Screenshots",
            "description": "Visual content increases engagement by 80%",
            "impact": "medium"
        })

        enhanced_suggestions["long_term"].append({
            "title": "Contribute to Open Source",
            "description": "Regular contributions show consistency and community engagement",
            "impact": "high"
        })

        enhanced_suggestions["long_term"].append({
            "title": "Build Projects in Trending Technologies",
            "description": "Stay current with industry trends to attract recruiters",
            "impact": "medium"
        })

        return {
            "current_score": analysis.overall_score,
            "potential_score": min(analysis.overall_score + 35, 100),
            "suggestions": enhanced_suggestions,
            "priority_actions": analysis.recommendations[:3]
        }

    except Exception as e:
        logger.exception("Error enhancing portfolio for %s", username)
        raise HTTPException(status_code=500, detail="Internal server error")


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
