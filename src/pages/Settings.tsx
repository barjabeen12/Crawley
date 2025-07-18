import React from 'react';

const Settings = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 pt-8 px-4 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white/80 dark:bg-slate-900/80 rounded-3xl shadow-xl p-10 border border-slate-200 dark:border-slate-800">
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4 text-center">
          Settings
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-300 text-center mb-8">
          "Tweak, tune, and make Crawley truly yours! (Coming soon)"
        </p>
        <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-6 text-center text-slate-400">
          <span className="text-2xl">🛠️</span>
          <div className="mt-2">Settings and preferences will appear here soon. Stay tuned for more magic!</div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 