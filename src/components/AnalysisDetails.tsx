import {
  ArrowLeft,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Globe,
  Link as LinkIcon,
  Heading1,
  Lock,
  Clock,
  Loader,
  XCircle,
  Check,
  Pause,
  BarChart3,
  PieChart,
  AlertCircle,
  Image as ImageIcon,
  FileText,
  Tag,
  RotateCcw,
  MoreVertical,
  ClipboardCopy,
  Link2,
  AlertOctagon,
  CheckCircle as CheckCircleIcon,
  Lock as LockIcon,
  Info,
  Code2,
  BadgeCheck
} from 'lucide-react';
import React, { useMemo, useState, useRef } from 'react';
import { URLAnalysis, BrokenLink } from '../types';
import { jsPDF } from "jspdf";
import { Chart, registerables } from "chart.js";
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

Chart.register(...registerables);

interface AnalysisDetailsProps {
  analysis: URLAnalysis;
  loading: boolean;
  brokenLinks: BrokenLink[];
  onRecrawlLink?: (url: string) => void;
  onRecrawlAll?: (urls: string[]) => void;
}

export const AnalysisDetails = ({ analysis, loading, brokenLinks = [], onRecrawlLink, onRecrawlAll }: AnalysisDetailsProps) => {
  const [showActions, setShowActions] = useState(false);
  const [showStructuredModal, setShowStructuredModal] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const totalLinks = (analysis.internal_links || 0) + (analysis.external_links || 0);
  // More accurate health score: 100 - (broken/total * 100), min 0
  const healthScore = totalLinks > 0 ? Math.max(0, Math.round(100 - (brokenLinks.length / totalLinks) * 100)) : 100;
  const healthColor = healthScore >= 90 ? 'bg-green-500' : healthScore >= 70 ? 'bg-yellow-400' : 'bg-red-500';
  const healthText = healthScore >= 90 ? 'Excellent' : healthScore >= 70 ? 'Needs Attention' : 'Critical';

  const crawlPhases = useMemo(() => [
    { key: 'queued', label: 'Queued', icon: <Clock className="w-5 h-5" /> },
    { key: 'running', label: 'Crawling', icon: <Loader className="w-5 h-5 " /> },
    { key: 'completed', label: 'Completed', icon: <Check className="w-5 h-5" /> },
    { key: 'error', label: 'Error', icon: <XCircle className="w-5 h-5" /> },
    { key: 'stopped', label: 'Stopped', icon: <Pause className="w-5 h-5" /> },
  ], []);
  const currentPhaseIdx = crawlPhases.findIndex(p => p.key === analysis.status);

  const headingCounts = [1, 2, 3, 4, 5, 6].map((level) => ({
    level,
    count: Number(analysis[`h${level}_count` as keyof URLAnalysis]) || 0,
  }));
  const maxHeadingCount = Math.max(...headingCounts.map(h => h.count), 1);

  const formatDateTime = (dt?: string) => dt ? new Date(dt).toLocaleString() : '-';

  const statusColorMap = {
    queued: 'text-gray-500',
    running: 'text-blue-500',
    completed: 'text-green-600',
    error: 'text-red-600',
    stopped: 'text-yellow-500',
  };

  const statusIconMap = {
    queued: <Clock className="w-5 h-5" />,
    running: <Loader className="w-5 h-5 animate-spin" />,
    completed: <Check className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    stopped: <Pause className="w-5 h-5" />,
  };

  // Only show timeline steps up to and including the current phase
  const visiblePhases = crawlPhases.slice(0, currentPhaseIdx + 1);

  const handleCopy = (url: string, id: number) => {
    navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 1200);
  };

  const chartRef = useRef<any>(null);

  const headingData = {
    labels: ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'],
    datasets: [
      {
        label: 'Heading Counts',
        data: [1, 2, 3, 4, 5, 6].map(l => Number(analysis[`h${l}_count`] || 0)),
        backgroundColor: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e42', '#10b981', '#f43f5e'],
      },
    ],
  };
  const headingOptions = {
    responsive: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
  };

  const handleExport = async () => {
    // Wait for chart to render
    const chartCanvas = chartRef.current?.canvas || chartRef.current;
    let chartImg = null;
    if (chartCanvas) {
      chartImg = chartCanvas.toDataURL('image/png');
    }
    const doc = new jsPDF();
    let y = 12;
    // Header block
    doc.setFillColor(59, 130, 246); // blue-500
    doc.rect(0, 0, 210, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('Crawl Report', 105, 13, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    y = 22;
    // URL & status
    doc.setFontSize(12);
    doc.text(`URL: ${analysis.url}`, 10, y); y += 7;
    doc.text(`Status: ${analysis.status}`, 10, y); y += 7;
    doc.text(`Page Title: ${analysis.page_title || 'Untitled Page'}`, 10, y); y += 7;
    doc.text(`Crawled: ${formatDateTime(analysis.completed_at)}`, 10, y); y += 7;
    // Health block
    doc.setFillColor(16, 185, 129); // green-500
    doc.rect(10, y, 190, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(`Health Score: ${healthScore} (${healthText})`, 15, y + 6);
    doc.setTextColor(0, 0, 0);
    y += 12;
    doc.text(`Internal Links: ${analysis.internal_links}`, 10, y);
    doc.text(`External Links: ${analysis.external_links}`, 70, y);
    doc.text(`Broken Links: ${brokenLinks.length}`, 140, y); y += 7;
    doc.text(`Orphan: ${analysis.is_orphan ? 'Yes' : 'No'}`, 10, y);
    doc.text(`Inbound Internal Links: ${analysis.inbound_internal_links ?? 0}`, 70, y); y += 7;
    // Meta & SEO
    doc.setFillColor(139, 92, 246); // purple-500
    doc.rect(10, y, 190, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text('Meta & SEO', 15, y + 6);
    doc.setTextColor(0, 0, 0);
    y += 12;
    doc.setFontSize(11);
    doc.text(`Meta Title: ${analysis.meta_title || '-'}`, 10, y); y += 6;
    doc.text(`Meta Description: ${analysis.meta_description || '-'}`, 10, y); y += 6;
    doc.text(`Canonical: ${analysis.canonical || '-'}`, 10, y); y += 6;
    doc.text(`Has Login Form: ${analysis.has_login_form ? 'Yes' : 'No'}`, 10, y); y += 6;
    doc.text(`Has JSON-LD: ${analysis.has_jsonld ? 'Yes' : 'No'}`, 10, y);
    doc.text(`Has Microdata: ${analysis.has_microdata ? 'Yes' : 'No'}`, 70, y);
    doc.text(`Has RDFa: ${analysis.has_rdfa ? 'Yes' : 'No'}`, 140, y); y += 8;
    // Content Structure
    doc.setFillColor(236, 72, 153); // pink-500
    doc.rect(10, y, 190, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text('Content Structure', 15, y + 6);
    doc.setTextColor(0, 0, 0);
    y += 12;
    if (chartImg) {
      doc.addImage(chartImg, 'PNG', 10, y, 90, 40);
      y += 45;
    } else {
      doc.text('Heading Counts:', 10, y); y += 7;
      [1,2,3,4,5,6].forEach(l => {
        doc.text(`H${l}: ${analysis[`h${l}_count`] || 0}`, 10 + (l-1)*30, y);
      });
      y += 7;
    }
    // Broken Links Table
    doc.setFillColor(239, 68, 68); // red-500
    doc.rect(10, y, 190, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text('Broken Links', 15, y + 6);
    doc.setTextColor(0, 0, 0);
    y += 12;
    if (brokenLinks.length === 0) {
      doc.text('No broken links found!', 10, y); y += 7;
    } else {
      doc.setFontSize(10);
      doc.setFillColor(243, 244, 246); // gray-100
      doc.rect(10, y, 190, 7, 'F');
      doc.text('URL', 12, y + 5);
      doc.text('Status', 180, y + 5);
      y += 8;
      brokenLinks.slice(0, 10).forEach((link, i) => {
        doc.text(link.url.slice(0, 70), 12, y);
        doc.text(String(link.status_code), 180, y);
        y += 6;
        if (y > 270) { doc.addPage(); y = 12; }
      });
      if (brokenLinks.length > 10) {
        doc.text(`...and ${brokenLinks.length - 10} more`, 12, y); y += 7;
      }
      doc.setFontSize(12);
    }
    // Structured Data
    doc.setFillColor(16, 185, 129); // green-500
    doc.rect(10, y, 190, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text('Structured Data Snippets', 15, y + 6);
    doc.setTextColor(0, 0, 0);
    y += 12;
    doc.setFontSize(10);
    if (analysis.has_jsonld && analysis.jsonld_snippet) {
      doc.text('JSON-LD:', 10, y); y += 5;
      doc.text(analysis.jsonld_snippet.slice(0, 400), 10, y, { maxWidth: 190 }); y += 15;
    }
    if (analysis.has_microdata && analysis.microdata_snippet) {
      doc.text('Microdata:', 10, y); y += 5;
      doc.text(analysis.microdata_snippet.slice(0, 400), 10, y, { maxWidth: 190 }); y += 15;
    }
    if (analysis.has_rdfa && analysis.rdfa_snippet) {
      doc.text('RDFa:', 10, y); y += 5;
      doc.text(analysis.rdfa_snippet.slice(0, 400), 10, y, { maxWidth: 190 }); y += 15;
    }
    doc.save('crawl-details.pdf');
  };

  return (
    <div className="relative min-h-screen">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-gradient-to-r from-blue-50/80 to-purple-50/80 dark:from-slate-900/80 dark:to-blue-950/80 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4 min-w-0">
          <span className="font-bold text-lg truncate text-slate-800 dark:text-slate-100">{analysis.page_title || 'Untitled Page'}</span>
          <span className={`ml-2 px-3 py-1 rounded-full text-xs font-semibold border ${analysis.status === 'completed' ? 'bg-green-100 text-green-700 border-green-200' : analysis.status === 'error' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>{analysis.status.toUpperCase()}</span>
        </div>
        <div className="flex gap-2">
          <a href={analysis.url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold shadow hover:from-blue-600 hover:to-purple-600 transition-all flex items-center gap-2"><ExternalLink className="w-4 h-4" /> Visit</a>
          {/* Recrawl button removed */}
        </div>
      </header>

      {/* Timeline - only show completed/current steps */}
      <div className="w-full max-w-5xl mx-auto mt-8 mb-12">
        <div className="flex items-center justify-center gap-0 relative">
          {visiblePhases.map((phase, idx) => (
            <React.Fragment key={phase.key}>
              <div className="flex flex-col items-center w-32">
                <div className={`rounded-full w-10 h-10 flex items-center justify-center border-2 ${idx < visiblePhases.length - 1 ? 'border-blue-500 bg-blue-100 dark:bg-blue-900' : 'border-purple-500 bg-purple-100 dark:bg-purple-900'} text-lg font-bold transition-all duration-300`}>{phase.icon}</div>
                <span className={`mt-2 text-xs font-semibold ${idx < visiblePhases.length - 1 ? 'text-blue-700 dark:text-blue-300' : 'text-purple-700 dark:text-purple-300'}`}>{phase.label}</span>
              </div>
              {idx < visiblePhases.length - 1 && <div className="flex-1 h-1 bg-blue-500 transition-all duration-300"></div>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Health Panel */}
      <section className="w-full max-w-5xl mx-auto mb-10">
        <div className="flex flex-col md:flex-row items-center md:items-stretch gap-8 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
          {/* Health Score Ring */}
          <div className="flex flex-col items-center justify-center min-w-[120px]">
            <div className="relative w-24 h-24 mb-2">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                <circle cx="50" cy="50" r="45" fill="none" strokeLinecap="round" stroke={healthScore >= 90 ? '#22c55e' : healthScore >= 70 ? '#facc15' : '#ef4444'} strokeWidth="10" strokeDasharray={`${healthScore * 2.83} ${283 - healthScore * 2.83}`} strokeDashoffset="25" style={{ transition: 'stroke-dasharray 0.5s' }} />
              </svg>
              <span className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold ${healthScore >= 90 ? 'text-green-500' : healthScore >= 70 ? 'text-yellow-500' : 'text-red-500'}`}>{healthScore}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Health</span>
              </span>
            </div>
            <span className={`text-xs font-semibold ${healthScore >= 90 ? 'text-green-600' : healthScore >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>{healthText}</span>
          </div>
          {/* Stats & Summary */}
          <div className="flex-1 flex flex-col gap-2 justify-center">
            <div className="flex flex-wrap gap-6 mb-2 items-center">
              <div className="flex items-center gap-2"><LinkIcon className="w-5 h-5 text-blue-500" /><span className="font-semibold">{totalLinks}</span><span className="text-xs text-slate-500 ml-1">Total</span></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /><span className="font-semibold">{analysis.internal_links}</span><span className="text-xs text-slate-500 ml-1">Internal</span></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-purple-500 inline-block" /><span className="font-semibold">{analysis.external_links}</span><span className="text-xs text-slate-500 ml-1">External</span></div>
              <div className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-500" /><span className="font-semibold">{brokenLinks.length}</span><span className="text-xs text-slate-500 ml-1">Broken</span></div>
              {/* Login form badge */}
              {analysis.has_login_form ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200"><LockIcon className="w-4 h-4" /> Login Form</span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold border border-gray-200"><LockIcon className="w-4 h-4" /> No Login</span>
              )}
              {/* Structured Data badge */}
              {(analysis.has_jsonld || analysis.has_microdata || analysis.has_rdfa) ? (
                <button
                  onClick={() => setShowStructuredModal(true)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold border border-green-200 hover:bg-green-200 transition-all"
                  title="View structured data"
                >
                  <Code2 className="w-4 h-4" /> Structured Data
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold border border-gray-200"><Code2 className="w-4 h-4" /> No Structured Data</span>
              )}
            </div>
            <div className="text-sm text-slate-700 dark:text-slate-200 mb-2">
              {brokenLinks.length > 0 ? (
                <span>{brokenLinks.length} broken link{brokenLinks.length > 1 ? 's' : ''} found. {healthScore < 90 && 'Improve your site health by fixing these issues.'}</span>
              ) : (
                <span className="text-green-600 font-semibold">No broken links found. Your site is healthy!</span>
              )}
            </div>
            <div className="flex gap-2 mt-2">
              {/* Recrawl All button removed */}
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold shadow hover:from-blue-600 hover:to-purple-600 transition-all" onClick={handleExport}><FileText className="w-4 h-4" /><span>Export as PDF</span></button>
            </div>
          </div>
        </div>
      </section>

      {/* Internal Linking Panel */}
      <section className="w-full max-w-5xl mx-auto mb-10">
        <div className="flex flex-col md:flex-row items-center gap-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900 dark:to-purple-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
          <div className="flex items-center gap-4 flex-1">
            <Link2 className="w-8 h-8 text-blue-500" />
            <div>
              <div className="text-lg font-bold text-slate-800 dark:text-slate-100">Internal Linking</div>
              <div className="text-sm text-slate-600 dark:text-slate-300">Inbound Internal Links: <span className="font-semibold text-blue-700 dark:text-blue-300">{analysis.inbound_internal_links ?? 0}</span></div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {analysis.is_orphan ? (
              <>
                <AlertOctagon className="w-6 h-6 text-red-500" />
                <span className="text-red-600 font-semibold">This page is orphaned!</span>
              </>
            ) : (
              <>
                <CheckCircleIcon className="w-6 h-6 text-green-500" />
                <span className="text-green-600 font-semibold">This page is linked internally</span>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Actionable Broken Links List */}
      <section className="w-full max-w-5xl mx-auto mb-12">
        <h2 className="text-xl font-bold text-red-600 dark:text-red-400 flex items-center gap-2 mb-4"><AlertTriangle className="w-6 h-6" /> Broken Links</h2>
        {brokenLinks.length === 0 ? (
          <div className="flex flex-col items-center justify-center bg-green-50 dark:bg-green-900/20 rounded-2xl p-8 text-green-700 dark:text-green-300 font-semibold text-lg shadow">
            <CheckCircle className="w-10 h-10 mb-2" />
            No broken links found!
          </div>
        ) : (
          <ul className="space-y-4">
            {brokenLinks.map((link) => (
              <li key={link.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-xl shadow border border-red-100 dark:border-red-800 p-4 transition-all">
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline break-all font-semibold">{link.url}</a>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Status: <span className={`font-bold ${link.status_code >= 400 ? 'text-red-600' : 'text-yellow-600'}`}>{link.status_code}</span></span>
                </div>
                <div className="flex gap-2 items-center">
                  <button onClick={() => onRecrawlLink && onRecrawlLink(link.url)} className="px-3 py-1 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold shadow hover:from-blue-600 hover:to-purple-600 transition-all">Recrawl</button>
                  <button onClick={() => handleCopy(link.url, link.id)} className={`px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold shadow hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex items-center gap-1 ${copied === link.id ? 'border-green-500 text-green-600' : ''}`}>{copied === link.id ? 'Copied!' : <ClipboardCopy className="w-4 h-4" />}</button>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"><ExternalLink className="w-4 h-4 text-blue-500" /></a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Content Structure Spotlight */}
      <section className="flex flex-col mb-5 gap-4 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2"><BarChart3 className="w-6 h-6 text-blue-400" /> Content Structure</h2>
        <div className="flex gap-2 items-end w-full">
          {[1,2,3,4,5,6].map(level => (
            <div key={level} className="flex flex-col items-center flex-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 mb-1">H{level}</span>
              <div className={`w-full rounded-t-xl ${level === 1 ? 'bg-blue-500' : level === 2 ? 'bg-purple-500' : 'bg-pink-500'} dark:bg-opacity-80`} style={{ height: `${(Number(analysis[`h${level}_count`] || 0) * 12) + 8}px`, minHeight: '8px', transition: 'height 0.5s' }} />
              <span className="text-xs text-slate-700 dark:text-slate-200 mt-1">{analysis[`h${level}_count`] || 0}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Floating Action Button */}
      <button onClick={() => setShowActions(v => !v)} className="fixed bottom-8 right-8 z-40 p-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-xl hover:scale-110 transition-transform flex items-center gap-2">
        <MoreVertical className="w-6 h-6" />
      </button>
      {showActions && (
        <div className="fixed bottom-24 right-8 z-50 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-4 min-w-[220px]">
          {/* Recrawl All button removed */}
          <a href={analysis.url} target="_blank" rel="noopener noreferrer" className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold shadow hover:from-blue-600 hover:to-purple-600 transition-all flex items-center gap-2"><ExternalLink className="w-4 h-4" /> Visit Page</a>
        </div>
      )}

      {/* Structured Data Modal */}
      {showStructuredModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 relative">
            <button
              onClick={() => setShowStructuredModal(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xl font-bold"
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Code2 className="w-6 h-6 text-green-500" /> Structured Data</h2>
            <div className="space-y-4">
              {analysis.has_jsonld && (
                <div>
                  <div className="flex items-center gap-2 mb-1"><BadgeCheck className="w-4 h-4 text-green-500" /><span className="font-semibold">JSON-LD</span></div>
                  <pre className="bg-slate-100 dark:bg-slate-800 rounded p-3 text-xs overflow-x-auto max-h-40 whitespace-pre-wrap">{analysis.jsonld_snippet}</pre>
                </div>
              )}
              {analysis.has_microdata && (
                <div>
                  <div className="flex items-center gap-2 mb-1"><BadgeCheck className="w-4 h-4 text-green-500" /><span className="font-semibold">Microdata</span></div>
                  <pre className="bg-slate-100 dark:bg-slate-800 rounded p-3 text-xs overflow-x-auto max-h-40 whitespace-pre-wrap">{analysis.microdata_snippet}</pre>
              </div>
            )}
              {analysis.has_rdfa && (
                <div>
                  <div className="flex items-center gap-2 mb-1"><BadgeCheck className="w-4 h-4 text-green-500" /><span className="font-semibold">RDFa</span></div>
                  <pre className="bg-slate-100 dark:bg-slate-800 rounded p-3 text-xs overflow-x-auto max-h-40 whitespace-pre-wrap">{analysis.rdfa_snippet}</pre>
                </div>
              )}
              {!(analysis.has_jsonld || analysis.has_microdata || analysis.has_rdfa) && (
                <div className="text-gray-500 text-sm">No structured data detected on this page.</div>
            )}
          </div>
        </div>
      </div>
      )}
      <Bar ref={chartRef} data={headingData} options={headingOptions} width={400} height={200} style={{ display: 'none' }} />
    </div>
  );
};