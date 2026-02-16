import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from './components/Homepage';
import Dashboard from './components/Dashboard';
import RepoDetail from './components/RepoDetail';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/dashboard/:username" element={<Dashboard />} />
          <Route path="/repo/:username/:repo" element={<RepoDetail />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
