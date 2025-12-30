
import React, { useState, useEffect } from 'react';
import { GameTable } from './components/GameTable';

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      // Check if the platform requires an API key selection
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } else {
        // Fallback for environments where key is pre-injected
        setHasKey(true);
      }
    };
    checkKey();
  }, []);

  const handleOpenKey = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      setHasKey(true); // Proceed immediately as per guidelines
    }
  };

  if (hasKey === null) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="text-amber-500 animate-pulse text-2xl font-serif">Entering the Tavern...</div>
      </div>
    );
  }

  if (hasKey === false) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-8 text-center">
        <div className="max-w-md bg-stone-900 border border-stone-800 p-8 rounded-3xl shadow-2xl">
          <h1 className="text-4xl font-serif text-amber-600 mb-4">The Doors are Locked</h1>
          <p className="text-stone-400 mb-8 leading-relaxed">
            Herr Meier requires a seat at the high-stakes table. To play with the AI, you must select your API key.
          </p>
          <button 
            onClick={handleOpenKey}
            className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg active:scale-95"
          >
            Enter Tavern & Select Key
          </button>
          <p className="mt-6 text-xs text-stone-600">
            Note: You'll need a paid GCP project key. 
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline ml-1">Learn about billing</a>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col py-8 px-4 font-sans selection:bg-amber-500 selection:text-stone-900">
      <header className="mb-8 text-center fade-in">
        <h1 className="text-5xl md:text-6xl font-serif text-amber-600 mb-2 drop-shadow-md">
          Herr & Frau <span className="text-stone-100">Meier</span>
        </h1>
        <p className="text-stone-500 text-sm md:text-base max-w-md mx-auto">
          The legendary tavern dice game of bluffing and intuition. 
          Challenge the master of deceit himself.
        </p>
      </header>
      
      <main className="flex-1">
        <GameTable />
      </main>

      <footer className="mt-12 text-center text-stone-600 text-xs fade-in" style={{animationDelay: '0.2s'}}>
        <div className="flex justify-center gap-6 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full"></span>
            <span>2-1 = Meier (1000)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
            <span>X-X = Double (100-600)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-stone-500 rounded-full"></span>
            <span>XY = Digits (65-31)</span>
          </div>
        </div>
        <p>&copy; 2024 Tavern Digital. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;
