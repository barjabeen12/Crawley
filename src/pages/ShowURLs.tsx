import { useState, useEffect } from "react";
import { AnalysisTable } from "../components/AnalysisTable";
import { useURLAnalysis } from "../hooks/useURLAnalysis";
import { useAnalysisDetails } from "../hooks/useAnalysisDetails";
import { PaginationParams } from "../types";
import { Settings, Loader2, Pause, ArrowLeft } from "lucide-react";
import { useUISettings } from "../contexts/AuthContext";
import { AnalysisDetails } from "../components/AnalysisDetails";
import { URLInput } from "../components/URLInput";

const ShowURLs = () => {
  const [showPollingSettings, setShowPollingSettings] = useState(false);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<number | null>(null);
  const [showAddUrlModal, setShowAddUrlModal] = useState(false);
  const {
    analyses,
    loading: analysesLoading,
    error: analysesError,
    setError: setAnalysesError,
    pagination,
    isPolling,
    pollingInterval,
    fetchAnalyses,
    startPolling,
    stopPolling,
    setPollingInterval,
    startCrawl,
    stopCrawl,
    deleteAnalyses,
    rerunAnalyses,
    addURL,
    loading,
  } = useURLAnalysis();
  const { autoStart } = useUISettings();
  const { analysis: selectedAnalysis, loading: detailsLoading, brokenLinks } = useAnalysisDetails(selectedAnalysisId ? String(selectedAnalysisId) : null);

  // Initial load
  useEffect(() => {
    fetchAnalyses({
      page: 1,
      limit: 10,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  }, []);

  const handlePageChange = (params: PaginationParams) => {
    fetchAnalyses(params);
  };

  const handleViewDetails = (id: number) => {
    setSelectedAnalysisId(id);
  };

  const handleBackToList = () => {
    setSelectedAnalysisId(null);
  };

  const handleBulkAction = async (
    action: "delete" | "rerun",
    ids: number[]
  ) => {
    try {
      if (action === "delete") {
        await deleteAnalyses(ids);
      } else if (action === "rerun") {
        await rerunAnalyses(ids);
      }
    } catch (error) {
      console.log(`Error ${action}ing analyses:`, error);
    }
  };

  const handleStartCrawl = async (id: number) => {
    try {
      await startCrawl(id);
    } catch (error) {
      console.log("Error starting crawl:", error);
    }
  };

  const handleStopCrawl = async (id: number) => {
    try {
      await stopCrawl(id);
    } catch (error) {
      console.log("Error stopping crawl:", error);
    }
  };

  const togglePolling = () => {
    if (isPolling) {
      stopPolling();
    } else {
      startPolling();
    }
  };

  // Recrawl handler for a single broken link
  const handleRecrawlLink = async (url: string) => {
    if (!selectedAnalysis) return;
    try {
      await startCrawl(selectedAnalysis.id); // You may want to call a specific endpoint for a single URL if available
      fetchAnalyses({
        page: 1,
        limit: 10,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
    } catch (error) {
      console.log("Error recrawling link:", error);
    }
  };

  // Recrawl handler for all broken links
  const handleRecrawlAll = async (urls: string[]) => {
    if (!selectedAnalysis) return;
    try {
      await startCrawl(selectedAnalysis.id); // You may want to call a batch endpoint if available
      fetchAnalyses({
        page: 1,
        limit: 10,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
    } catch (error) {
      console.log("Error recrawling all links:", error);
    }
  };

  const handleAddURL = async (url: string, autoStart: boolean = true) => {
    try {
      await addURL(url, autoStart);
      setShowAddUrlModal(false);
    } catch (error) {
      // Optionally show error
    }
  };

  if (selectedAnalysisId && selectedAnalysis) {
    return (
      <div className="min-h-screen bg-background pt-8 px-4 flex flex-col items-center">
        <div className="w-full max-w-7xl space-y-8">
          <button
            onClick={handleBackToList}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 font-semibold border border-blue-200 hover:bg-blue-200/60 transition-colors shadow mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to List
          </button>
          <AnalysisDetails
            analysis={selectedAnalysis}
            loading={detailsLoading}
            brokenLinks={brokenLinks}
            onRecrawlLink={handleRecrawlLink}
            onRecrawlAll={handleRecrawlAll}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-8 px-4 flex flex-col items-center">
      <div className="w-full max-w-7xl space-y-8">
        {/* Add URL Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowAddUrlModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold shadow hover:from-purple-600 hover:to-blue-600 transition-colors"
          >
            <span className="text-lg font-bold">+</span> Add URL
          </button>
        </div>
        {/* Polling Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePolling}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold transition-colors shadow-sm
                ${isPolling
                  ? "bg-green-500/10 text-green-600 border-green-500/30 hover:bg-green-500/20"
                  : "bg-gray-500/10 text-gray-400 border-gray-500/30 hover:bg-gray-500/20"}
              `}
            >
              {isPolling ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Auto-refresh On
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4" />
                  Auto-refresh Off
                </>
              )}
            </button>
            <button
              onClick={() => setShowPollingSettings(!showPollingSettings)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-white/80 dark:bg-slate-900/80 hover:bg-accent transition-colors font-semibold shadow text-slate-700 dark:text-slate-200"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
            <span className={`ml-2 px-3 py-1 rounded-full text-xs font-semibold ${autoStart ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
              Auto-start: {autoStart ? 'On' : 'Off'}
            </span>
          </div>
        </div>
        {showPollingSettings && (
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl mb-4">
            <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-100">Polling Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                  Refresh Interval (seconds)
                </label>
                <select
                  value={pollingInterval}
                  onChange={(e) => setPollingInterval(Number(e.target.value))}
                  className="px-3 py-2 rounded-lg border border-border bg-background/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                >
                  <option value={2000}>2 seconds</option>
                  <option value={5000}>5 seconds</option>
                  <option value={10000}>10 seconds</option>
                  <option value={30000}>30 seconds</option>
                  <option value={60000}>1 minute</option>
                </select>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>
                  <strong>Auto-refresh:</strong> Automatically enabled when there are running or queued jobs. You can manually control it using the toggle above.
                </p>
              </div>
            </div>
          </div>
        )}
        <AnalysisTable
          analyses={analyses}
          loading={analysesLoading}
          isPolling={isPolling}
          pagination={pagination}
          onPageChange={handlePageChange}
          onViewDetails={handleViewDetails}
          onBulkAction={handleBulkAction}
          onStartCrawl={handleStartCrawl}
          onStopCrawl={handleStopCrawl}
        />
      </div>
      {/* Add URL Modal */}
      {showAddUrlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 relative">
            <button
              onClick={() => setShowAddUrlModal(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xl font-bold"
              aria-label="Close"
            >
              ×
            </button>
            <URLInput onAddURL={handleAddURL} loading={loading} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ShowURLs; 