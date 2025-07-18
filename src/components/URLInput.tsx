import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { useUISettings } from "../contexts/AuthContext";

interface URLInputProps {
  onAddURL: (url: string, autoStart: boolean) => void;
  loading?: boolean;
}

export const URLInput = ({ onAddURL, loading = false }: URLInputProps) => {
  const [url, setUrl] = useState("");
  const { autoStart, setAutoStart } = useUISettings();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onAddURL(url.trim(), autoStart);
      setUrl("");
    }
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const urlValid = !url || isValidUrl(url);

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900 dark:to-blue-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 max-w-2xl mx-auto transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Add URL for Analysis
        </h2>
      </div>
      <div className="mb-6 p-4 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold mb-1 text-slate-700 dark:text-slate-200">Auto-start crawling</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Automatically start crawling after adding a URL
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={autoStart}
            onChange={(e) => setAutoStart(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer-checked:bg-purple-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
        </label>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">
            URL
          </label>
          <input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            disabled={loading}
            className={`w-full px-4 py-3 rounded-xl border bg-background/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-purple-400/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-colors ${
              !urlValid
                ? "border-red-500/50 focus:ring-red-500/50"
                : "border-slate-200 dark:border-slate-700"
            }`}
          />
          {!urlValid && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              Please enter a valid URL
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={loading || !url.trim() || !urlValid}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-bold text-lg shadow-lg hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Adding URL...
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              Add URL {autoStart ? "& Start Crawling" : ""}
            </>
          )}
        </button>
      </form>
      {autoStart && (
        <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 text-blue-600 dark:text-blue-300">
          <strong>Auto-start enabled:</strong> Crawling will begin immediately after adding the URL
        </div>
      )}
      <div className="mt-6 text-center text-slate-400 dark:text-slate-500 text-xs italic">
        "Let Crawley do the crawling, you do the chilling!"
      </div>
    </div>
  );
};
