import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Map, BarChart3, Zap, ArrowRight } from 'lucide-react';

export default function MarketingPage() {
  const features = [
    {
      icon: Map,
      title: '12 Ayrshire Towns',
      desc: 'Ayr, Prestwick, Troon, Kilmarnock, Irvine, and more. Live listings and market data.',
    },
    {
      icon: BarChart3,
      title: 'AI-Powered Intel',
      desc: 'Buy bands, rent ranges, yields. BTL, BRRR, Flip, HMO strategies with confidence scores.',
    },
    {
      icon: Zap,
      title: 'Strategy Builder',
      desc: 'Flow-based config. Run automated analysis and surface deals that match your criteria.',
    },
  ];

  return (
    <div className="marketing-page">
      <header className="marketing-header">
        <div className="marketing-logo">
          <div className="logo-box">A</div>
          <span>Ayrshire Acq. Deal Engine</span>
        </div>
        <nav className="marketing-nav">
          <Link to="/app" className="marketing-nav-link">Dashboard</Link>
          <Link to="/admin" className="marketing-nav-link">Admin</Link>
          <Link to="/app" className="marketing-cta-btn">
            Get Started
          </Link>
        </nav>
      </header>

      <main className="marketing-main">
        <motion.section
          className="marketing-hero"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1>Property Deal Intel for Ayrshire</h1>
          <p className="marketing-hero-sub">
            Algorithmic buy bands, live listings, rental yields. Surface BTL, BRRR, and flip opportunities across 12 towns.
          </p>
          <Link to="/app" className="marketing-hero-btn">
            Open Deal Engine <ArrowRight size={18} />
          </Link>
        </motion.section>

        <section className="marketing-features">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="marketing-feature-card"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i, duration: 0.4 }}
            >
              <div className="marketing-feature-icon">
                <f.icon size={24} />
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </motion.div>
          ))}
        </section>

        <motion.section
          className="marketing-cta"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <h2>Ready to find your next deal?</h2>
          <Link to="/app" className="marketing-cta-btn large">
            Launch Dashboard
          </Link>
        </motion.section>
      </main>

      <footer className="marketing-footer">
        <span>Ayrshire Acq. Deal Engine v2.0</span>
      </footer>
    </div>
  );
}
