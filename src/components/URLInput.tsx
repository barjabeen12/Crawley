import { useState } from "react";
import { Plus, Loader2, Settings } from "lucide-react";

interface URLInputProps {
  onAddURL: (url: string, autoStart: boolean) => void;
  loading?: boolean;
}

export const URLInput = ({ onAddURL, loading = false }: URLInputProps) => {
  const [url, setUrl] = useState("");
  const [autoStart, setAutoStart] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

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
    <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6 rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Add URL for Analysis</h2>
      </div>

      <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium mb-1">Auto-start crawling</h3>
            <p className="text-sm text-muted-foreground">
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
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
          </label>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium mb-2">
            URL
          </label>
          <input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            disabled={loading}
            className={`w-full px-4 py-3 rounded-lg border bg-background/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-colors ${
              !urlValid
                ? "border-red-500/50 focus:ring-red-500/50"
                : "border-border"
            }`}
          />
          {!urlValid && (
            <p className="mt-1 text-sm text-red-600">
              Please enter a valid URL
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !url.trim() || !urlValid}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
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
        <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <p className="text-sm text-blue-600">
            <strong>Auto-start enabled:</strong> Crawling will begin immediately
            after adding the URL
          </p>
        </div>
      )}
    </div>
  );
};
