import React, { useState } from 'react';
import { X, Server, Database, Activity, Code2, Terminal, Check, Copy } from 'lucide-react';

interface ArchitectureModalProps {
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ onClose }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const installScript = `# 1. Clone the repository
git clone https://github.com/your-org/url-shortener.git
cd url-shortener

# 2. Install dependencies
npm install

# 3. Configure environment (.env)
cp .env.example .env
# Set MONGODB_URI=mongodb://localhost:27017/url_shortener
# (or MongoDB Atlas connection string)

# 4. Start local MongoDB (if not using Atlas)
# macOS (Homebrew): brew services start mongodb/brew/mongodb-community
# Linux: sudo systemctl start mongod
# Docker: docker run -d -p 27017:27017 --name mongo-dev mongo:latest

# 5. Run development server (Node.js Express + Vite)
npm run dev

# 6. Production Build & Start
npm run build
npm run start`;

  const dockerScript = `# Build Docker Container
docker build -t url-shortener .

# Run with local MongoDB container network
docker network create app-network

docker run -d --name mongodb --network app-network mongo:latest

docker run -d -p 3000:3000 --name shortener-app \\
  --network app-network \\
  -e MONGODB_URI="mongodb://mongodb:27017/url_shortener" \\
  -e PORT="3000" \\
  url-shortener`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/90 rounded-2xl p-6 sm:p-8 shadow-2xl my-8 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-100">
                System Architecture & Installation Guide
              </h3>
              <p className="text-xs sm:text-sm text-slate-400">
                Production-grade Node.js, Express, MongoDB (Mongoose) & React analytics architecture
              </p>
            </div>
          </div>
        </div>

        {/* Architecture Flow Diagram */}
        <div className="mb-8 bg-slate-950 p-5 sm:p-6 rounded-xl border border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-3 flex items-center gap-1.5">
            <Activity className="w-4 h-4" /> Component & Data Flow Architecture
          </h4>
          <div className="font-mono text-xs text-slate-300 overflow-x-auto whitespace-pre leading-relaxed p-2 bg-slate-900/80 rounded-lg border border-slate-800/80">
{`┌───────────────────────────┐      ┌───────────────────────────┐
│     Client / Browser      │      │     Visitor / Scanner     │
│  (React 19 + Recharts)    │      │  (Redirect / QR Scanner)  │
└─────────────┬─────────────┘      └─────────────┬─────────────┘
              │                                  │
    HTTP / REST API Requests             GET /r/:shortCode
              │                                  │
              ▼                                  ▼
┌──────────────────────────────────────────────────────────────┐
│             Node.js + Express High-Speed Server              │
│  • Rate Limiter & Input Sanitizer (nanoid, valid-url)        │
│  • Real-Time User-Agent Parser (ua-parser-js)                │
│  • QR Code Generator Engine (qrcode)                         │
└──────────────┬───────────────────────────────┬───────────────┘
               │                               │
        Write / Query                   Log Click Event
               │ (Mongoose ODM)                │ (Async 302 Redirect)
               ▼                               ▼
┌──────────────────────────────────────────────────────────────┐
│                      MongoDB Database                        │
│                                                              │
│  Collection: "urls"               Collection: "clickevents"  │
│  • shortCode (Unique Index)       • shortCode (Index)        │
│  • originalUrl                    • timestamp (TTL Index)    │
│  • clicks (Atomic counter)        • referrer, userAgent      │
│  • tags, title, expiresAt         • browser, os, device, ip  │
└──────────────────────────────────────────────────────────────┘`}
          </div>
        </div>

        {/* Architecture Specs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm mb-1">
              <Server className="w-4 h-4" /> Node.js & Express
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Provides millisecond response 302 redirects with non-blocking click tracking, parameter sanitization, and structured REST API endpoints.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-1">
              <Database className="w-4 h-4" /> MongoDB & Mongoose
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Stores URL records with unique indexing on <code className="text-emerald-300">shortCode</code>, atomic click increments (<code className="text-emerald-300">$inc</code>), and indexed timeseries click logs.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm mb-1">
              <Code2 className="w-4 h-4" /> Analytics & Frontend
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Built with React 19, Tailwind CSS, and Recharts. Features instant QR code downloads, device and referrer analytics, and click logs.
            </p>
          </div>
        </div>

        {/* Installation Instructions */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                Local Installation & Running Instructions
              </h4>
              <button
                type="button"
                onClick={() => copyToClipboard(installScript, 'install')}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-800 border border-slate-700 transition"
              >
                {copiedSection === 'install' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Commands</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto">
              {installScript}
            </pre>
          </div>

          {/* Docker Commands */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-400" />
                Docker & Container Instructions
              </h4>
              <button
                type="button"
                onClick={() => copyToClipboard(dockerScript, 'docker')}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-800 border border-slate-700 transition"
              >
                {copiedSection === 'docker' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Commands</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-blue-300 overflow-x-auto">
              {dockerScript}
            </pre>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
