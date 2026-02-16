# GitHub Portfolio Analyzer & Enhancer

A modern web application that analyzes GitHub profiles and provides actionable insights to improve your developer portfolio.

## Features

- **Portfolio Analysis**: Get a comprehensive score (0-100) for your GitHub profile
- **Repository Health Checks**: Analyze individual repositories with detailed metrics
- **Smart Recommendations**: Receive actionable suggestions to improve your portfolio
- **README Enhancer**: Generate professional README templates
- **Beautiful UI**: Clean, modern interface with responsive design

## Tech Stack

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- React Router
- Lucide Icons

### Backend
- FastAPI
- Python 3.8+
- GitHub API Integration
- HTTPX for async requests

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Python 3.8+
- pip

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd project
```

2. **Install Frontend Dependencies**
```bash
npm install
```

3. **Install Backend Dependencies**
```bash
cd backend
pip install -r requirements.txt
cd ..
```

### Running the Application

1. **Start the Backend Server**
```bash
cd backend
python main.py
```
The API will be available at `http://localhost:8000`

2. **Start the Frontend (in a new terminal)**
```bash
npm run dev
```
The app will be available at `http://localhost:5173`

## Usage

1. Open the application in your browser
2. Enter a GitHub username on the homepage
3. View the comprehensive portfolio analysis
4. Click on individual repositories for detailed insights
5. Use the README enhancer to generate improved documentation
6. Follow the recommendations to enhance your portfolio

## API Endpoints

- `GET /analyze/{username}` - Analyze a GitHub user's portfolio
- `GET /repo/{username}/{repo}` - Get detailed repository analysis
- `POST /enhance/readme` - Generate enhanced README template
- `POST /enhance/portfolio` - Get enhanced improvement plan

## Features in Detail

### Portfolio Dashboard
- Overall portfolio score
- Strengths and weaknesses analysis
- Personalized recommendations
- Repository grid with health indicators
- Enhanced action plan with quick wins

### Repository Analysis
- Detailed statistics (stars, forks, issues)
- Language breakdown
- README quality assessment
- Recent commit history
- Missing section detection

### README Enhancer
- Detects missing documentation sections
- Generates comprehensive README templates
- One-click copy functionality
- Professional formatting

## Contributing

Contributions are welcome! Feel free to submit issues or pull requests.

## License

MIT License
