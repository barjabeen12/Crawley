/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useState, useEffect } from "react";
import { URLInput } from "../components/URLInput";
import { AnalysisTable } from "../components/AnalysisTable";
import { AnalysisDetails } from "../components/AnalysisDetails";
import { useURLAnalysis } from "../hooks/useURLAnalysis";
import { useAnalysisDetails } from "../hooks/useAnalysisDetails";
import { PaginationParams } from "../types";
import { ArrowLeft, Settings, Loader2, Pause, Play } from "lucide-react";

const Index = () => {
  const [currentView, setCurrentView] = useState<"list" | "details">("list");
  const [selectedAnalysisId, setSelectedAnalysisId] = useState("");
  const [showPollingSettings, setShowPollingSettings] = useState(false);

  const {
    analyses,
    loading: analysesLoading,
    error: analysesError,
    setError: setAnalysesError,
    pagination,
    isPolling,
    pollingInterval,
    fetchAnalyses,
    addURL,
    startCrawl,
    stopCrawl,
    deleteAnalyses,
    rerunAnalyses,
    startPolling,
    stopPolling,
    setPollingInterval,
  } = useURLAnalysis();

  const { analysis: selectedAnalysis, loading: detailsLoading } =
    useAnalysisDetails(selectedAnalysisId);

  // Initial load
  useEffect(() => {
    fetchAnalyses({
      page: 1,
      limit: 10,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  }, []);

  const handleAddURL = async (url: string, autoStart: boolean = true) => {
    try {
      await addURL(url, autoStart);
    } catch (error) {
      console.log("Error adding URL:", error);
    }
  };

  const handlePageChange = (params: PaginationParams) => {
    fetchAnalyses(params);
  };

  const handleViewDetails = (id: string) => {
    setSelectedAnalysisId(id);
    setCurrentView("details");
  };

  const handleBackToList = () => {
    setCurrentView("list");
    setSelectedAnalysisId("");
  };

  const handleBulkAction = async (
    action: "delete" | "rerun",
    ids: string[]
  ) => {
    try {
      if (action === "delete") {
        //@ts-ignore
        await deleteAnalyses(ids);
      } else if (action === "rerun") {
        //@ts-ignore
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

  const handlePollingIntervalChange = (interval: number) => {
    setPollingInterval(interval);
  };

  const togglePolling = () => {
    if (isPolling) {
      stopPolling();
    } else {
      startPolling();
    }
  };

  if (currentView === "details" && selectedAnalysis) {
    return (
      <div className="min-h-screen bg-white p-4">
        <div className="max-w-7xl mx-auto space-y-6 p-4  text-black">
          <div className="mb-6">
            <button
              onClick={handleBackToList}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card/50 backdrop-blur-sm border-1 text-gray border-white/10 hover:bg-card/70 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to List
            </button>
          </div>

          <AnalysisDetails
            analysis={selectedAnalysis}
            loading={detailsLoading}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-7xl mx-auto space-y-6 p-4  bg-white text-black">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black mb-2">
              URL Analysis Dashboard
            </h1>
            <p className="text-black-300">
              Analyze websites and track crawling progress
            </p>
          </div>

          <div className="flex items-center gap-4 ">
            {/* Polling Controls */}
            <div className="flex items-center gap-2 ">
              <button
                onClick={togglePolling}
                className={`flex items-center gap-2 sm:gap-2 gap-1 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border transition-colors text-sm sm:text-base
                  ${
                    isPolling
                      ? "bg-green-500/10 text-green-600 border-green-500/30 hover:bg-green-500/20"
                      : "bg-gray-500/10 text-gray-400 border-gray-500/30 hover:bg-gray-500/20"
                  }`}
              >
                {isPolling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="hidden xs:inline">Auto-refresh On</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4" />
                    <span className="hidden xs:inline">Auto-refresh Off</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowPollingSettings(!showPollingSettings)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </div>
          </div>
        </div>

        {/* Polling Settings */}
        {showPollingSettings && (
          <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold mb-4">Polling Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Refresh Interval (seconds)
                </label>
                <select
                  value={pollingInterval}
                  onChange={(e) =>
                    handlePollingIntervalChange(Number(e.target.value))
                  }
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
                  <strong>Auto-refresh:</strong> Automatically enabled when
                  there are running or queued jobs. You can manually control it
                  using the toggle above.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {analysesError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 relative">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="text-red-600 font-medium">Error</div>
              </div>
              <button
                onClick={() => setAnalysesError(null)}
                className="text-red-600 hover:text-red-800 text-sm"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <p className="text-red-600 mt-1">{analysesError}</p>
          </div>
        )}

        {/* URL Input */}
        <URLInput onAddURL={handleAddURL} loading={analysesLoading} />

        {/* Analysis Table */}
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
    </div>
  );
};

export default Index;
