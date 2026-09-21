import React, { useState } from 'react';
import { Link2, Database, BookOpen, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { SystemStatus } from '../types/index.js';

interface HeaderProps {
  systemStatus: SystemStatus | null;
  onRefresh: () => void;
  onOpenDocs: () => void;
  onSeedData: () => void;
  isSeeding: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  systemStatus,
  onRefresh,
  onOpenDocs,
  onSeedData,
  isSeeding,
}) => {
  const [showDbInfo, setShowDbInfo] = useState(false);

  const isMongo = systemStatus?.isMongoConnected;

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Link2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-100 tracking-tight">
                SwiftLink <span className="text-blue-400 font-mono text-xs font-normal px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">v1.2</span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Node.js + MongoDB URL Shortener & Real-Time Analytics
            </p>
          </div>
        </div>

        {/* Database Status & Header Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* DB Indicator Pill */}
          <div className="relative">
            <button
              id="db-status-btn"
              type="button"
              onClick={() => setShowDbInfo(!showDbInfo)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                isMongo
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50 hover:bg-emerald-900/60'
                  : 'bg-indigo-950/60 text-indigo-300 border-indigo-700/50 hover:bg-indigo-900/60'
              }`}
              title="Click for Database Architecture & Connection Details"
            >
              <span className={`w-2 h-2 rounded-full animate-pulse ${isMongo ? 'bg-emerald-400' : 'bg-indigo-400'}`} />
              <Database className="w-3.5 h-3.5" />
              <span className="hidden md:inline">
                {isMongo ? 'MongoDB Connected' : 'Embedded DB (MongoDB Ready)'}
              </span>
              <span className="md:hidden">
                {isMongo ? 'Mongo' : 'Local DB'}
              </span>
            </button>

            {/* Popover */}
            {showDbInfo && (
              <div className="absolute right-0 mt-2 w-80 p-4 rounded-xl bg-slate-800 border border-slate-700 shadow-2xl text-xs z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-blue-400" /> Database Status
                  </span>
                  <button
                    onClick={() => setShowDbInfo(false)}
                    className="text-slate-400 hover:text-slate-200"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-2 text-slate-300">
                  <div className="flex items-center justify-between py-1 border-b border-slate-700/50">
                    <span className="text-slate-400">Driver Mode:</span>
                    <span className="font-mono text-blue-300 font-medium">
                      {isMongo ? 'Mongoose (Production)' : 'Local File Persistence'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-700/50">
                    <span className="text-slate-400">Connection State:</span>
                    <span className={`font-mono font-medium flex items-center gap-1 ${isMongo ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {isMongo ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3.5 h-3.5" /> Standby (Local Fallback)
                        </>
                      )}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                    To connect to a live MongoDB Atlas or local MongoDB instance, provide <code className="text-blue-300 bg-slate-900 px-1 py-0.5 rounded">MONGODB_URI</code> in your environment settings.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Seed Button */}
          <button
            id="seed-data-btn"
            type="button"
            onClick={onSeedData}
            disabled={isSeeding}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition"
            title="Seed demo URLs and click analytics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin text-blue-400' : ''}`} />
            <span className="hidden sm:inline">{isSeeding ? 'Seeding...' : 'Add Sample Data'}</span>
          </button>

          {/* Architecture & Docs Button */}
          <button
            id="open-docs-btn"
            type="button"
            onClick={onOpenDocs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Architecture & Guide</span>
            <span className="sm:hidden">Docs</span>
          </button>
        </div>
      </div>
    </header>
  );
};
