import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Globe, Lock, Zap, TrendingUp, UserPlus, LogIn } from 'lucide-react';

const features = [
  {
    icon: <Globe className="w-8 h-8 text-blue-500" />,
    title: 'Deep Website Analysis',
    desc: 'Uncover HTML versions, heading structure, link health, and login forms in a single click.'
  },
  {
    icon: <Zap className="w-8 h-8 text-purple-500" />,
    title: 'Real-Time Crawling',
    desc: 'Track progress live. See queued, running, and completed jobs instantly.'
  },
  {
    icon: <Lock className="w-8 h-8 text-pink-500" />,
    title: 'Secure & Private',
    desc: 'Your data is protected with JWT and API key authentication. No peeking, just crawling!'
  },
  {
    icon: <TrendingUp className="w-8 h-8 text-green-500" />,
    title: 'Bulk Operations',
    desc: 'Delete, rerun, or manage multiple crawl jobs with a single swoosh.'
  },
];

const pricing = [
  {
    name: 'Free',
    price: '$0',
    features: [
      'Analyze up to 5 URLs/month',
      'Basic crawl insights',
      'Community support',
    ],
    cta: 'Get Started',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$19',
    features: [
      'Unlimited URL analysis',
      'Priority crawling',
      'Advanced insights',
      'Email support',
    ],
    cta: 'Start Free Trial',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Contact Us',
    features: [
      'Custom integrations',
      'Dedicated support',
      'SLAs & onboarding',
    ],
    cta: 'Contact Sales',
    highlight: false,
  },
];

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Crawley</span>
          <span className="ml-2 text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded-full font-semibold">Beta</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/auth" className="flex items-center gap-1 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold shadow hover:from-blue-600 hover:to-purple-600 transition-all">
            <LogIn className="w-4 h-4" /> Login
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto text-center py-24 px-4">
        <h1 className="text-5xl sm:text-6xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
          Crawl. Analyze. Conquer.
        </h1>
        <p className="text-xl sm:text-2xl text-slate-700 dark:text-slate-200 mb-8 max-w-2xl mx-auto">
          Meet <span className="font-bold text-blue-600">Crawley</span> — your quirky, all-seeing web crawler. Get instant insights, spot broken links, and discover hidden login forms. <br />
          <span className="italic">"Because the web is a jungle, and you need a map!"</span>
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link to="/auth" className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold text-lg shadow-lg hover:from-blue-600 hover:to-purple-600 transition-all flex items-center gap-2">
            <UserPlus className="w-5 h-5" /> Get Started Free
          </Link>
          <Link to="/auth" className="px-8 py-4 rounded-xl bg-white/80 text-blue-600 font-bold text-lg border border-blue-200 shadow hover:bg-blue-50 transition-all flex items-center gap-2">
            <LogIn className="w-5 h-5" /> Login
          </Link>
        </div>
        <div className="text-slate-500 text-sm mt-2">No credit card required. Start crawling in seconds!</div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto py-16 px-4">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Why Choose Crawley?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {features.map((f, i) => (
            <div key={i} className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300 text-center flex flex-col items-center">
              {f.icon}
              <h3 className="text-xl font-semibold mt-4 mb-2 text-slate-800">{f.title}</h3>
              <p className="text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="max-w-6xl mx-auto py-16 px-4">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Simple, Honest Pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricing.map((plan, i) => (
            <div key={i} className={`rounded-3xl p-8 shadow-lg border-2 transition-all duration-300 flex flex-col items-center ${plan.highlight ? 'border-purple-500 scale-105 bg-purple-50' : 'border-gray-100 bg-white hover:shadow-xl'}`}>
              <h3 className="text-2xl font-bold mb-2 text-slate-800">{plan.name}</h3>
              <div className="text-4xl font-extrabold mb-4 text-purple-600">
                {plan.price}
                {plan.price !== 'Contact Us' && <span className="text-lg font-medium text-slate-500">/mo</span>}
              </div>
              <ul className="mb-6 space-y-2 text-slate-600 text-left">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> {f}</li>
                ))}
              </ul>
              <Link to="/auth" className={`w-full px-6 py-3 rounded-xl font-bold text-lg shadow ${plan.highlight ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600' : 'bg-white text-purple-600 border border-purple-200 hover:bg-purple-50'}`}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
        <div className="text-center text-slate-400 text-sm mt-8">Cancel anytime. No hidden fees. <span className="italic">"Because pricing should be as clear as your crawl results!"</span></div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-slate-400 text-sm">
        &copy; {new Date().getFullYear()} Crawley. Made with &lt;3 for web explorers.
      </footer>
    </div>
  );
};

export default LandingPage;
