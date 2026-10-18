import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import NeuralBackground from '../components/common/NeuralBackground.jsx';

const NotFoundPage = () => {
  return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', position: 'relative' }}>
      <NeuralBackground />
      <div className="glass-card" style={{ maxWidth: '480px', zIndex: 10 }}>
        <h1 style={{ fontSize: '4rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '10px' }}>404</h1>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '12px' }}>Topic or Page Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>
          The requested study path does not exist in your curriculum syllabus. Let's redirect you back to your primary learning dashboard.
        </p>
        <Link to="/dashboard" className="btn btn-primary">
          <Home size={18} /> Return to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
