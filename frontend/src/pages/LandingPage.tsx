import { Link } from 'react-router-dom';
import {
  Sprout, CheckCircle, PhoneCall, Search, FileText,
  TrendingUp, Users, ShieldCheck, ArrowRight,
} from 'lucide-react';

export default function LandingPage() {
  const features = [
    {
      icon: Search,
      title: 'Personalized Scheme Matching',
      titleHi: 'व्यक्तिगत योजना मिलान',
      desc: 'AI-powered filtering based on your land area, income, caste, crops, and location shows you only the schemes you\'re eligible for.',
    },
    {
      icon: FileText,
      title: 'Document Guidance',
      titleHi: 'दस्तावेज़ मार्गदर्शन',
      desc: 'Clear list of required documents for each scheme. Know exactly what to prepare before visiting a CSC center.',
    },
    {
      icon: TrendingUp,
      title: 'Application Tracking',
      titleHi: 'आवेदन ट्रैकिंग',
      desc: 'Track the status of all your applications in one place. Get notified when benefits are approved or disbursed.',
    },
    {
      icon: PhoneCall,
      title: 'AI Call Assistant',
      titleHi: 'AI कॉल सहायक',
      desc: 'For farmers without smartphones, we call you directly in your language to explain eligible schemes and guide you through the process.',
    },
  ];

  const stats = [
    { value: '15+', label: 'Government Schemes' },
    { value: '100%', label: 'Free to Use' },
    { value: '₹0', label: 'Registration Fee' },
    { value: '24/7', label: 'Information Access' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-600 rounded-full flex items-center justify-center">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-bold text-brand-800 text-lg">Kisan Sahayak</span>
              <p className="text-xs text-brand-600 hindi leading-none">किसान सहायक</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-secondary text-sm">Login / लॉगिन</Link>
            <Link to="/register" className="btn-primary text-sm">Register Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-800 via-brand-700 to-brand-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 lg:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-brand-600/50 rounded-full px-4 py-2 text-sm mb-6">
              <ShieldCheck className="w-4 h-4 text-earth-300" />
              <span>Trusted platform for Indian Farmers</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-4">
              Find Government Schemes
              <span className="block text-earth-300 hindi mt-1">सरकारी योजनाएं खोजें</span>
              <span className="block text-2xl lg:text-3xl mt-2 font-medium text-brand-200">Made for You, in Your Language</span>
            </h1>
            <p className="text-brand-100 text-lg mb-8 leading-relaxed">
              We analyze your farm data — land, income, caste, crops, location — and show you only the schemes you actually qualify for. No confusion, no middlemen.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/register" className="btn-primary bg-earth-400 hover:bg-earth-500 text-brand-900 text-base px-6 py-3">
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/login" className="btn-secondary bg-white/10 border-white/30 text-white hover:bg-white/20 text-base px-6 py-3">
                I already have an account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-brand-50 border-y border-brand-100">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map(s => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-bold text-brand-700">{s.value}</div>
                <div className="text-sm text-gray-600 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
          <p className="text-gray-500 mt-2 hindi">कैसे काम करता है</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {features.map(f => (
            <div key={f.title} className="card hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center mb-4">
                <f.icon className="w-6 h-6 text-brand-600" />
              </div>
              <h3 className="font-semibold text-gray-900 text-lg">{f.title}</h3>
              <p className="text-xs text-brand-600 hindi mb-2">{f.titleHi}</p>
              <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Phone users section */}
      <section className="bg-earth-50 border-y border-earth-100">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="flex flex-col lg:flex-row items-center gap-10">
            <div className="flex-1">
              <div className="w-16 h-16 bg-earth-400 rounded-2xl flex items-center justify-center mb-6">
                <PhoneCall className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Don't Have a Smartphone?
                <span className="block hindi text-earth-700 text-xl mt-1">स्मार्टफोन नहीं है?</span>
              </h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                No problem! Our AI Call Assistant will call you on your regular phone number and explain:
              </p>
              <ul className="space-y-3">
                {[
                  'Which schemes you qualify for',
                  'Benefits and deadlines of each scheme',
                  'Documents required for application',
                  'Nearest CSC center with charges',
                  'Follow up on your application status',
                ].map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-brand-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 max-w-sm">
              <div className="card border-2 border-earth-200 bg-white">
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-earth-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <PhoneCall className="w-8 h-8 text-earth-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">Register with Survey Data</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    If you were surveyed by our field team, we already have your data and will call you automatically.
                  </p>
                  <div className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
                    <p className="hindi text-base text-gray-600 font-medium mb-1">हम आपको कॉल करेंगे</p>
                    We'll call you in Hindi or your local language
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Start Finding Your Schemes Today
        </h2>
        <p className="text-gray-500 text-lg mb-8 hindi">आज ही शुरू करें - मुफ्त और आसान</p>
        <Link to="/register" className="btn-primary text-base px-8 py-3">
          Register Now — It's Free
          <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-brand-900 text-brand-300 text-center py-6 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sprout className="w-4 h-4 text-brand-400" />
          <span className="font-medium text-white">Kisan Sahayak</span>
          <span className="hindi text-brand-400">किसान सहायक</span>
        </div>
        <p>Helping Indian farmers access government schemes • {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
