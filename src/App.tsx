import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.js';
import { StatsCards } from './components/StatsCards.js';
import { ShortenForm } from './components/ShortenForm.js';
import { UrlList } from './components/UrlList.js';
import { AnalyticsDashboard } from './components/AnalyticsDashboard.js';
import { QrModal } from './components/QrModal.js';
import { ArchitectureModal } from './components/ArchitectureModal.js';
import { UrlItem, GlobalStats, SystemStatus } from './types/index.js';

export default function App() {
  const [urls, setUrls] = useState<UrlItem[]>([]);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  // Active view: null for URLs List & Shortener, or a string shortCode for Analytics
  const [activeAnalyticsCode, setActiveAnalyticsCode] = useState<string | null>(null);

  // Modals
  const [qrModalUrl, setQrModalUrl] = useState<UrlItem | null>(null);
  const [showDocsModal, setShowDocsModal] = useState(false);

  // Load URLs & statistics
  const fetchAllData = useCallback(async () => {
    try {
      const [urlsRes, statsRes, statusRes] = await Promise.all([
        fetch('/api/urls'),
        fetch('/api/stats'),
        fetch('/api/status'),
      ]);

      if (urlsRes.ok) {
        const urlsData = await urlsRes.json();
        setUrls(urlsData.urls || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setSystemStatus(statusData);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleUrlCreated = (newUrl: UrlItem) => {
    setUrls((prev) => [newUrl, ...prev.filter((u) => u.shortCode !== newUrl.shortCode)]);
    setStats((prev) => ({
      totalUrls: (prev?.totalUrls || 0) + 1,
      totalClicks: prev?.totalClicks || 0,
      activeUrls: (prev?.activeUrls || 0) + 1,
      mostVisitedUrl: prev?.mostVisitedUrl || null,
    }));
  };

  const handleDeleteUrl = async (shortCode: string) => {
    try {
      const res = await fetch(`/api/urls/${shortCode}`, { method: 'DELETE' });
      if (res.ok) {
        setUrls((prev) => prev.filter((u) => u.shortCode !== shortCode));
        if (activeAnalyticsCode === shortCode) {
          setActiveAnalyticsCode(null);
        }
        fetchAllData();
      }
    } catch (err) {
      console.error('Failed to delete url:', err);
    }
  };

  const handleToggleStatus = async (shortCode: string) => {
    try {
      const res = await fetch(`/api/urls/${shortCode}/toggle`, { method: 'PATCH' });
      if (res.ok) {
        const json = await res.json();
        setUrls((prev) =>
          prev.map((u) => (u.shortCode === shortCode ? { ...u, isActive: json.url.isActive } : u))
        );
        fetchAllData();
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      if (res.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error('Failed to seed sample data:', err);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Header */}
      <Header
        systemStatus={systemStatus}
        onRefresh={fetchAllData}
        onOpenDocs={() => setShowDocsModal(true)}
        onSeedData={handleSeedData}
        isSeeding={seeding}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeAnalyticsCode ? (
          /* Detailed Analytics View */
          <AnalyticsDashboard
            shortCode={activeAnalyticsCode}
            onBack={() => {
              setActiveAnalyticsCode(null);
              fetchAllData();
            }}
          />
        ) : (
          /* Core Dashboard View */
          <div className="space-y-2">
            {/* Global Stats Row */}
            <StatsCards
              stats={stats}
              onSelectTopUrl={(code) => setActiveAnalyticsCode(code)}
            />

            {/* URL Shortening Form */}
            <ShortenForm
              onUrlCreated={handleUrlCreated}
              onOpenQr={(url) => setQrModalUrl(url)}
              onOpenAnalytics={(code) => setActiveAnalyticsCode(code)}
            />

            {/* Shortened URLs Directory & Controls */}
            <UrlList
              urls={urls}
              loading={loading}
              onOpenAnalytics={(code) => setActiveAnalyticsCode(code)}
              onOpenQr={(url) => setQrModalUrl(url)}
              onDeleteUrl={handleDeleteUrl}
              onToggleStatus={handleToggleStatus}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Built with Node.js, Express, MongoDB (Mongoose), React & Tailwind CSS
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowDocsModal(true)}
              className="hover:text-slate-300 transition"
            >
              Architecture & Installation Guide
            </button>
            <span>•</span>
            <span className="font-mono text-slate-400">
              API Status: 200 OK
            </span>
          </div>
        </div>
      </footer>

      {/* QR Code Modal */}
      <QrModal url={qrModalUrl} onClose={() => setQrModalUrl(null)} />

      {/* Architecture & Setup Guide Modal */}
      {showDocsModal && <ArchitectureModal onClose={() => setShowDocsModal(false)} />}
    </div>
  );
}
