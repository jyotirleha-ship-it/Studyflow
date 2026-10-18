import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Brain, Compass, LineChart, ShieldCheck, Flame, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import NeuralBackground from '../components/common/NeuralBackground.jsx';

const LandingPage = () => {
  const { t } = useTranslation();

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <NeuralBackground />
      
      {/* Header */}
      <header style={{
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '24px 48px',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.4rem', fontWeight: 800 }}>
          <span style={{
            background: 'linear-gradient(135deg, var(--primary), var(--accent-cyan))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            ⚡ StudyFlow
          </span>
        </div>

        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <Link to="/login" className="btn btn-secondary">
            Sign In
          </Link>
          <Link to="/register" className="btn btn-primary">
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{
        position: 'relative',
        zIndex: 10,
        maxWidth: '1100px',
        margin: '60px auto',
        padding: '0 24px',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(99, 102, 241, 0.15)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          color: 'var(--primary)',
          fontSize: '0.85rem',
          fontWeight: 700,
          marginBottom: '24px'
        }}>
          <Sparkles size={16} /> Intelligent Learning Operating System
        </div>

        <h1 style={{
          fontSize: 'clamp(2.5rem, 5vw, 4.2rem)',
          fontWeight: 800,
          lineHeight: 1.15,
          letterSpacing: '-1px',
          marginBottom: '20px'
        }}>
          Study with an AI Mentor that adapts to your{' '}
          <span style={{
            background: 'linear-gradient(135deg, var(--primary), var(--accent-purple), var(--accent-pink))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Personal Learning DNA
          </span>
        </h1>

        <p style={{
          fontSize: '1.2rem',
          color: 'var(--text-secondary)',
          maxWidth: '750px',
          margin: '0 auto 36px auto',
          lineHeight: 1.6
        }}>
          Not another static to-do list. StudyFlow analyzes your focus stamina, detects prerequisite gaps, catches surface understanding, and automatically repairs your schedule when life gets in the way.
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '60px' }}>
          <Link to="/register" className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '1.05rem' }}>
            Start Learning For Free <ArrowRight size={18} />
          </Link>
          <Link to="/login" className="btn btn-secondary" style={{ padding: '14px 28px', fontSize: '1.05rem' }}>
            Sign In
          </Link>
        </div>

        {/* Feature Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          textAlign: 'left'
        }}>
          <div className="glass-card interactive-card">
            <div style={{ color: 'var(--primary)', marginBottom: '14px' }}>
              <Brain size={32} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px' }}>Personal Learning DNA</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Discovers your peak focus hours, optimal session duration, and retention curve through empirical data.
            </p>
          </div>

          <div className="glass-card interactive-card">
            <div style={{ color: 'var(--accent-emerald)', marginBottom: '14px' }}>
              <Compass size={32} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px' }}>Next Best Study Action</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Never wonder what to study next. Mathematical weighting balances exam proximity and weak topics.
            </p>
          </div>

          <div className="glass-card interactive-card">
            <div style={{ color: 'var(--accent-cyan)', marginBottom: '14px' }}>
              <ShieldCheck size={32} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px' }}>Fake Understanding Detector</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Differentiates between passive recognition and actual problem-solving understanding through adaptive diagnostic questions.
            </p>
          </div>

          <div className="glass-card interactive-card">
            <div style={{ color: 'var(--streak-fire)', marginBottom: '14px' }}>
              <Flame size={32} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px' }}>Automatic Plan Repair</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Missed a study task? StudyFlow intelligently rebalances remaining slots to prevent overload.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
