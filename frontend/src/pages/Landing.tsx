import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  const handleGetStarted = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/signup', { state: { email } });
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo />

            <div className="flex items-center gap-6">
              <a href="#features" className="text-sm text-gray-700 hover:text-gray-900">
                Features
              </a>
              <a href="#pricing" className="text-sm text-gray-700 hover:text-gray-900">
                Pricing
              </a>
              <a href="#docs" className="text-sm text-gray-700 hover:text-gray-900">
                Docs
              </a>
              <button
                onClick={() => navigate('/login')}
                className="text-sm text-gray-700 hover:text-gray-900 font-medium"
              >
                Log in
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="btn-primary"
              >
                Start for free
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 min-h-[650px]">
        {/* Background Video - Optional: uncomment and add your video file */}
        {/*
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        >
          <source src="/videos/background.mp4" type="video/mp4" />
        </video>
        */}

        {/* Decorative cloud elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Large puffy cloud cluster - left side */}
          <div className="absolute top-32 -left-40 w-[600px] h-[400px]">
            <div className="absolute top-0 left-0 w-80 h-80 bg-teal-300 rounded-full opacity-50 blur-[100px]"></div>
            <div className="absolute top-20 left-40 w-96 h-96 bg-cyan-300 rounded-full opacity-45 blur-[120px]"></div>
            <div className="absolute top-60 left-20 w-72 h-72 bg-emerald-300 rounded-full opacity-40 blur-[90px]"></div>
          </div>

          {/* Right side cloud cluster */}
          <div className="absolute top-40 -right-32 w-[500px] h-[350px]">
            <div className="absolute top-0 right-0 w-72 h-72 bg-teal-300 rounded-full opacity-50 blur-[90px]"></div>
            <div className="absolute top-32 right-24 w-80 h-80 bg-cyan-200 rounded-full opacity-45 blur-[100px]"></div>
          </div>

          {/* Large bottom left cloud */}
          <div className="absolute -bottom-40 -left-20 w-[700px] h-[500px]">
            <div className="absolute bottom-0 left-0 w-[500px] h-[400px] bg-teal-200 rounded-full opacity-60 blur-[130px]"></div>
            <div className="absolute bottom-32 left-40 w-96 h-96 bg-cyan-200 rounded-full opacity-55 blur-[110px]"></div>
            <div className="absolute bottom-64 left-80 w-80 h-80 bg-emerald-200 rounded-full opacity-50 blur-[100px]"></div>
          </div>

          {/* Bottom right cloud cluster */}
          <div className="absolute -bottom-32 right-20 w-[450px] h-[400px]">
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-100 rounded-full opacity-60 blur-[100px]"></div>
            <div className="absolute bottom-40 right-32 w-80 h-80 bg-teal-200 rounded-full opacity-55 blur-[90px]"></div>
          </div>

          {/* Center accent clouds for depth */}
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-emerald-200 rounded-full opacity-30 blur-[80px]"></div>
          <div className="absolute top-2/3 right-1/4 w-56 h-56 bg-cyan-200 rounded-full opacity-35 blur-[70px]"></div>
        </div>

        <div className="relative max-w-5xl mx-auto px-6 lg:px-8 py-24 md:py-32 text-center z-10">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Engineering Trade Studies
            <br />
            <span className="underline decoration-4 underline-offset-8">Simplified</span>
          </h1>
          <p className="text-xl md:text-2xl text-white mb-12 max-w-3xl mx-auto leading-relaxed">
            Automate component evaluation and scoring. Make data-driven decisions faster.
          </p>

          {/* CTA Buttons and Email Form */}
          <div className="max-w-2xl mx-auto space-y-4">
            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('/signup')}
                className="bg-white text-teal-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                Start now
              </button>
              <button
                onClick={() => window.open('https://calendly.com', '_blank')}
                className="bg-white text-teal-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                Book a demo
              </button>
            </div>

            {/* Email Form */}
            <form onSubmit={handleGetStarted} className="max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full px-5 py-3 rounded-lg border-0 focus:ring-2 focus:ring-white outline-none text-gray-900 placeholder-gray-500"
                required
              />
            </form>

            <p className="text-white text-sm mt-4">
              Free to get started. No credit card required.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Trade study features
            </h2>
            <p className="text-xl text-gray-600">
              Tools for systematic component evaluation
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-all">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Automated Scoring
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Score and rank components against weighted criteria
              </p>
            </div>

            <div className="p-6 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-all">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Fast Results
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Complete trade studies in minutes vs. weeks
              </p>
            </div>

            <div className="p-6 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-all">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Reports & Exports
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Generate reports with visualizations and data tables
              </p>
            </div>

            <div className="p-6 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-all">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Custom Criteria
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Define weighted criteria for your requirements
              </p>
            </div>

            <div className="p-6 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-all">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Version History
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Track changes and compare study iterations
              </p>
            </div>

            <div className="p-6 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-all">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Team Collaboration
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Share studies and collaborate on decisions
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Start your first trade study
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Used by engineering teams for component evaluation
          </p>
          <button
            onClick={() => navigate('/signup')}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
          >
            Get started
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="mb-4">
                <Logo />
              </div>
              <p className="text-sm text-gray-600">
                Trade study platform for engineering teams
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900">Features</a></li>
                <li><a href="#" className="hover:text-gray-900">Pricing</a></li>
                <li><a href="#" className="hover:text-gray-900">Documentation</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900">About</a></li>
                <li><a href="#" className="hover:text-gray-900">Blog</a></li>
                <li><a href="#" className="hover:text-gray-900">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900">Privacy</a></li>
                <li><a href="#" className="hover:text-gray-900">Terms</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-12 pt-8 text-center text-sm text-gray-600">
            © 2025 TradeForm. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
