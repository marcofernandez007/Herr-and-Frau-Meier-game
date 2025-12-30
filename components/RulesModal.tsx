
import React from 'react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-stone-900 border-2 border-stone-800 rounded-[2rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl transition-transform duration-300 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-serif text-amber-500">How to Play Meier</h2>
            <button 
              onClick={onClose}
              className="text-stone-500 hover:text-white transition-colors"
            >
              <i className="fas fa-times text-2xl"></i>
            </button>
          </div>

          <div className="space-y-8 text-stone-300 leading-relaxed">
            <section>
              <h3 className="text-xl font-bold text-stone-100 mb-2 flex items-center gap-2">
                <i className="fas fa-trophy text-amber-600"></i> The Goal
              </h3>
              <p>
                Meier is a game of bluffing. Your objective is to roll a higher value than the previous player or 
                catch your opponent in a lie. If you can't beat their claim, you must bluff!
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-stone-100 mb-3 flex items-center gap-2">
                <i className="fas fa-list-ol text-amber-600"></i> Ranking & Scoring
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-stone-800/50 p-4 rounded-xl border border-stone-700">
                  <p className="text-amber-500 font-bold mb-1">1. MEIER</p>
                  <p className="text-xs">A roll of <span className="text-stone-100 font-mono">2-1</span> (21). The highest possible score. Instant power move.</p>
                </div>
                <div className="bg-stone-800/50 p-4 rounded-xl border border-stone-700">
                  <p className="text-amber-500 font-bold mb-1">2. DOUBLES</p>
                  <p className="text-xs">Identical dice (<span className="text-stone-100 font-mono">66, 55, ... 11</span>). Higher doubles beat lower ones.</p>
                </div>
                <div className="bg-stone-800/50 p-4 rounded-xl border border-stone-700">
                  <p className="text-amber-500 font-bold mb-1">3. DIGITS</p>
                  <p className="text-xs">The high die is the 10s, low is the 1s (e.g., <span className="text-stone-100 font-mono">5-2</span> is 52). Lowest is 31.</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-xl font-bold text-stone-100 mb-2 flex items-center gap-2">
                <i className="fas fa-user-secret text-amber-600"></i> The Turn
              </h3>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li><span className="text-stone-100 font-bold">Trust:</span> You believe the claim. You must now roll and claim a value <span className="italic">strictly higher</span> than the previous one.</li>
                <li><span className="text-stone-100 font-bold">Challenge:</span> You think they're lying. Reveal the dice! If they lied, they lose a point. If they told the truth, <span className="text-red-400">you</span> lose a point.</li>
              </ul>
            </section>

            <div className="bg-amber-900/20 border border-amber-800/50 p-4 rounded-2xl italic text-sm text-amber-200/80">
              "In a tavern, the truth is whatever you can get someone to believe." — Herr Meier
            </div>

            <button 
              onClick={onClose}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-4 rounded-xl transition-all"
            >
              Back to the Table
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
