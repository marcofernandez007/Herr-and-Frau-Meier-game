
import React, { useState, useEffect, useCallback } from 'react';
import { GamePhase, GameState, DieResult, Difficulty } from '../types';
import { getRollValue, formatRollName } from '../constants';
import { getAIDecision, AIResponse } from '../services/geminiService';
import { soundService } from '../services/soundService';
import { Die } from './Die';
import { RulesModal } from './RulesModal';

export const GameTable: React.FC = () => {
  const initialState: GameState = {
    playerScore: 0,
    aiScore: 0,
    lastClaim: 0,
    currentDice: null,
    currentTurn: 'PLAYER',
    phase: GamePhase.WAITING,
    message: "Welcome to Meier! Roll to start your turn.",
    isLying: false,
    history: [],
    difficulty: 'medium'
  };

  const [gameState, setGameState] = useState<GameState>(initialState);
  const [aiCommentary, setAiCommentary] = useState<string>("Are you ready to lose some copper, friend?");
  const [isLoading, setIsLoading] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [challengeOutcome, setChallengeOutcome] = useState<'truth' | 'bluff' | null>(null);

  const rollDice = (): [DieResult, DieResult] => {
    return [
      (Math.floor(Math.random() * 6) + 1) as DieResult,
      (Math.floor(Math.random() * 6) + 1) as DieResult
    ];
  };

  const updateHistory = (actor: 'PLAYER' | 'AI', action: string, claim: string, wasTruth: boolean | null = null) => {
    setGameState(prev => ({
      ...prev,
      history: [...prev.history, { turn: prev.history.length + 1, actor, action, claim, wasTruth }]
    }));
  };

  const handleResetGame = () => {
    if (window.confirm("Are you sure you want to clear the scores and start over?")) {
      setGameState(initialState);
      setAiCommentary("Fresh start, eh? My luck hasn't changed!");
      setChallengeOutcome(null);
      soundService.playClack();
    }
  };

  const setDifficulty = (diff: Difficulty) => {
    setGameState(prev => ({ ...prev, difficulty: diff }));
    soundService.playClack();
    const comment = {
      easy: "Ah, looking for an easy night? I'll go easy on the schnapps.",
      medium: "A fair challenge for a fair gambler.",
      hard: "Brave soul. I hope your coin purse is heavy."
    }[diff];
    setAiCommentary(comment);
  };

  const handlePlayerRoll = () => {
    if (gameState.phase !== GamePhase.WAITING && gameState.phase !== GamePhase.DECIDING) return;
    
    soundService.playRoll();
    setChallengeOutcome(null);
    setGameState(prev => ({ ...prev, phase: GamePhase.ROLLING, message: "Rolling the dice..." }));
    
    setTimeout(() => {
      const dice = rollDice();
      const actualValue = getRollValue(dice[0], dice[1]);
      soundService.playClack();
      setGameState(prev => ({
        ...prev,
        currentDice: dice,
        phase: GamePhase.CLAIMING,
        message: `You rolled a ${formatRollName(actualValue)}. Now, tell a story...`
      }));
    }, 1200);
  };

  const handlePlayerClaim = (value: number) => {
    const actualValue = getRollValue(gameState.currentDice![0], gameState.currentDice![1]);
    const isLying = value !== actualValue;
    
    if (value === 1000) soundService.playMeierFanfare();
    else soundService.playClack();

    setGameState(prev => ({
      ...prev,
      lastClaim: value,
      isLying,
      phase: GamePhase.DECIDING,
      currentTurn: 'AI',
      message: `You claimed ${formatRollName(value)}. Herr Meier is thinking...`
    }));
    updateHistory('PLAYER', 'CLAIM', formatRollName(value), !isLying);
    
    triggerAIReaction(value);
  };

  const triggerAIReaction = async (playerClaim: number) => {
    setIsLoading(true);
    try {
      const aiResponse: AIResponse = await getAIDecision({
        playerLastClaim: playerClaim,
        history: gameState.history,
        difficulty: gameState.difficulty
      });

      setAiCommentary(aiResponse.commentary);

      if (aiResponse.decision === 'CHALLENGE') {
        handleAiChallenge();
      } else {
        setGameState(prev => ({
          ...prev,
          message: "Herr Meier believes you! Now he must beat your claim."
        }));
        handleAiRoll(playerClaim);
      }
    } catch (error: any) {
      console.error(error);
      if (error.message === "API_KEY_ERROR") {
        alert("Your API key seems invalid or from a non-paid project. Please try re-selecting.");
        if (window.aistudio) window.aistudio.openSelectKey();
      }
      handleAiChallenge();
    } finally {
      setIsLoading(false);
    }
  };

  const handleAiChallenge = () => {
    const wasLying = gameState.isLying;
    setGameState(prev => ({ ...prev, phase: GamePhase.REVEALING }));
    setChallengeOutcome(wasLying ? 'bluff' : 'truth');

    setTimeout(() => {
      if (wasLying) {
        soundService.playFail();
        setGameState(prev => ({
          ...prev,
          aiScore: prev.aiScore + 1,
          message: `CAUGHT! You were lying! Herr Meier wins this round.`,
          phase: GamePhase.WAITING,
          currentTurn: 'AI',
          lastClaim: 0
        }));
      } else {
        soundService.playSuccess();
        setGameState(prev => ({
          ...prev,
          playerScore: prev.playerScore + 1,
          message: `FOOLED! You told the truth. Herr Meier loses a point!`,
          phase: GamePhase.WAITING,
          currentTurn: 'PLAYER',
          lastClaim: 0
        }));
      }
    }, 2500); // Slightly longer for the glow to shine
  };

  const handleAiRoll = async (targetToBeat: number) => {
    soundService.playRoll();
    setChallengeOutcome(null);
    setGameState(prev => ({ ...prev, phase: GamePhase.ROLLING, message: "Herr Meier is rolling..." }));
    
    setTimeout(async () => {
      const dice = rollDice();
      const actualValue = getRollValue(dice[0], dice[1]);
      soundService.playClack();
      
      try {
        const aiClaimResponse = await getAIDecision({
          playerLastClaim: targetToBeat,
          aiActualRoll: actualValue,
          history: gameState.history,
          difficulty: gameState.difficulty
        });

        setAiCommentary(aiClaimResponse.commentary);
        const claim = aiClaimResponse.claimedValue || (actualValue > targetToBeat ? actualValue : targetToBeat + 1);

        if (claim === 1000) soundService.playMeierFanfare();

        setGameState(prev => ({
          ...prev,
          currentDice: dice,
          lastClaim: claim,
          isLying: claim !== actualValue,
          phase: GamePhase.DECIDING,
          currentTurn: 'PLAYER',
          message: `Herr Meier claims ${formatRollName(claim)}. Do you believe him?`
        }));
        updateHistory('AI', 'CLAIM', formatRollName(claim), claim === actualValue);
      } catch (err) {
        const claim = targetToBeat + 1;
        setGameState(prev => ({
          ...prev,
          currentDice: dice,
          lastClaim: claim,
          isLying: true,
          phase: GamePhase.DECIDING,
          currentTurn: 'PLAYER',
          message: `Herr Meier claims ${formatRollName(claim)}. Do you believe him?`
        }));
      }
    }, 1500);
  };

  const handlePlayerReaction = (trust: boolean) => {
    if (!trust) {
      const aiWasLying = gameState.isLying;
      setGameState(prev => ({ ...prev, phase: GamePhase.REVEALING }));
      setChallengeOutcome(aiWasLying ? 'bluff' : 'truth');

      setTimeout(() => {
        const actualValue = getRollValue(gameState.currentDice![0], gameState.currentDice![1]);
        if (aiWasLying) {
          soundService.playSuccess();
          setGameState(prev => ({
            ...prev,
            playerScore: prev.playerScore + 1,
            message: `NICE! Herr Meier was bluffing with a ${formatRollName(actualValue)}!`,
            phase: GamePhase.WAITING,
            lastClaim: 0
          }));
        } else {
          soundService.playFail();
          setGameState(prev => ({
            ...prev,
            aiScore: prev.aiScore + 1,
            message: `DAMN! He was telling the truth! It was a ${formatRollName(actualValue)}.`,
            phase: GamePhase.WAITING,
            lastClaim: 0
          }));
        }
      }, 2500);
    } else {
      soundService.playClack();
      setGameState(prev => ({
        ...prev,
        phase: GamePhase.WAITING,
        currentTurn: 'PLAYER',
        message: "You believe him! Your turn to roll and beat the claim."
      }));
    }
  };

  const getPossibleClaims = () => {
    const claims = [31, 32, 41, 42, 43, 51, 52, 53, 54, 61, 62, 63, 64, 65, 110, 220, 330, 440, 550, 660, 1000];
    return claims.filter(c => c > gameState.lastClaim);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 fade-in">
      {/* Header / Scores */}
      <div className="flex justify-between items-center bg-stone-900/80 p-6 rounded-2xl border border-stone-800 mb-8 backdrop-blur-md shadow-xl relative">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-2">
          <button 
            onClick={() => setShowRules(true)}
            className="bg-stone-800 border border-stone-700 text-stone-400 hover:text-amber-500 hover:border-amber-500 px-3 py-1 rounded-full text-xs font-bold transition-all shadow-lg flex items-center gap-1"
          >
            <i className="fas fa-question-circle"></i> Rules
          </button>
          <button 
            onClick={handleResetGame}
            className="bg-stone-800 border border-stone-700 text-stone-400 hover:text-red-500 hover:border-red-500 px-3 py-1 rounded-full text-xs font-bold transition-all shadow-lg flex items-center gap-1"
          >
            <i className="fas fa-rotate-left"></i> Reset
          </button>
        </div>

        {/* Difficulty Selector */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center bg-stone-900 border border-stone-800 rounded-full px-1 py-1 shadow-lg z-30">
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`
                px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all duration-300
                ${gameState.difficulty === d 
                  ? 'bg-amber-600 text-white shadow-[0_0_10px_rgba(217,119,6,0.5)] scale-105' 
                  : 'text-stone-500 hover:text-stone-300'}
              `}
            >
              {d}
            </button>
          ))}
        </div>
        
        <div className="text-center">
          <p className="text-stone-500 uppercase text-xs font-bold tracking-widest mb-1">Player</p>
          <p className="text-4xl font-serif text-amber-500">{gameState.playerScore}</p>
        </div>
        <div className="text-center px-4">
          <p className="text-stone-600 italic text-sm">Target to beat</p>
          <p className="text-2xl font-mono text-stone-300">
            {gameState.lastClaim === 0 ? "—" : formatRollName(gameState.lastClaim)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-stone-500 uppercase text-xs font-bold tracking-widest mb-1">Herr Meier</p>
          <p className="text-4xl font-serif text-red-500">{gameState.aiScore}</p>
        </div>
      </div>

      <div className="relative aspect-[16/10] md:aspect-video bg-stone-900 rounded-[3rem] border-8 border-stone-800 shadow-2xl flex flex-col items-center justify-center overflow-hidden table-inner-shadow">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/dark-wood.png')]"></div>

        <div className="absolute top-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-stone-700 rounded-full border-4 border-stone-600 flex items-center justify-center text-3xl mb-4 shadow-lg overflow-hidden">
             <img src={`https://picsum.photos/seed/meier-${gameState.difficulty}/100/100`} alt="Herr Meier" className="grayscale opacity-80" />
          </div>
          <div className="bg-stone-800/90 backdrop-blur-sm px-6 py-2 rounded-full border border-stone-700 shadow-xl max-w-xs text-center relative">
             {isLoading && <div className="absolute -top-2 -right-2 w-4 h-4 bg-amber-500 rounded-full animate-ping"></div>}
             <p className="text-stone-300 italic text-sm">"{aiCommentary}"</p>
          </div>
        </div>

        <div className="flex gap-8 items-center justify-center mt-20">
          {(gameState.phase === GamePhase.ROLLING || (gameState.phase !== GamePhase.WAITING && gameState.currentDice)) ? (
             <>
               <Die 
                  value={gameState.currentDice?.[0] || 1} 
                  rolling={gameState.phase === GamePhase.ROLLING}
                  intense={gameState.phase === GamePhase.ROLLING && gameState.currentTurn === 'PLAYER'}
                  highlight={gameState.phase === GamePhase.REVEALING ? (challengeOutcome === 'truth' ? 'success' : 'fail') : null}
                />
               <Die 
                  value={gameState.currentDice?.[1] || 1} 
                  rolling={gameState.phase === GamePhase.ROLLING} 
                  intense={gameState.phase === GamePhase.ROLLING && gameState.currentTurn === 'PLAYER'}
                  highlight={gameState.phase === GamePhase.REVEALING ? (challengeOutcome === 'truth' ? 'success' : 'fail') : null}
                />
             </>
          ) : (
            <div className="text-stone-800 text-6xl opacity-30"><i className="fas fa-dice"></i></div>
          )}
        </div>

        <div className="mt-12 text-center px-4 w-full z-20">
          <p className="text-xl font-medium mb-6 text-stone-200 min-h-[1.5rem] drop-shadow-lg">{gameState.message}</p>
          
          <div className="flex flex-wrap gap-4 justify-center">
            {(gameState.phase === GamePhase.WAITING || (gameState.phase === GamePhase.DECIDING && gameState.currentTurn === 'PLAYER' && gameState.lastClaim === 0)) && (
              <button 
                onClick={handlePlayerRoll}
                disabled={isLoading}
                className="bg-amber-600 hover:bg-amber-500 text-white px-8 py-4 rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
              >
                <i className="fas fa-hand-rock"></i> Shake & Roll
              </button>
            )}

            {gameState.phase === GamePhase.CLAIMING && gameState.currentTurn === 'PLAYER' && (
              <div className="flex flex-col items-center gap-4">
                 <div className="flex gap-2 flex-wrap justify-center max-w-md">
                    <button 
                      onClick={() => handlePlayerClaim(getRollValue(gameState.currentDice![0], gameState.currentDice![1]))}
                      className="bg-stone-100 text-stone-900 px-4 py-2 rounded-lg font-bold border-2 border-green-500 shadow-md hover:bg-white transition-colors"
                    >
                      Truth: {formatRollName(getRollValue(gameState.currentDice![0], gameState.currentDice![1]))}
                    </button>
                    {getPossibleClaims().slice(0, 4).map(claim => (
                      <button 
                        key={claim}
                        onClick={() => handlePlayerClaim(claim)}
                        className="bg-stone-800 text-stone-200 px-4 py-2 rounded-lg font-bold border border-stone-600 hover:bg-stone-700 shadow-md transition-colors"
                      >
                        Bluff: {formatRollName(claim)}
                      </button>
                    ))}
                    <button 
                      onClick={() => handlePlayerClaim(1000)}
                      className="bg-red-900/50 text-red-200 px-4 py-2 rounded-lg font-bold border border-red-700 hover:bg-red-800 shadow-md transition-colors"
                    >
                      Meier!
                    </button>
                 </div>
              </div>
            )}

            {gameState.phase === GamePhase.DECIDING && gameState.currentTurn === 'PLAYER' && gameState.lastClaim > 0 && (
              <div className="flex gap-4">
                 <button 
                   onClick={() => handlePlayerReaction(false)}
                   disabled={isLoading}
                   className="bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2"
                 >
                   <i className="fas fa-search"></i> Challenge
                 </button>
                 <button 
                   onClick={() => handlePlayerReaction(true)}
                   disabled={isLoading}
                   className="bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2"
                 >
                   <i className="fas fa-check"></i> Trust
                 </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tavern Logs */}
      <div className="mt-8 bg-stone-900/50 rounded-2xl p-6 border border-stone-800 shadow-lg">
        <h3 className="text-stone-500 uppercase text-xs font-bold tracking-widest mb-4 flex items-center gap-2">
          <i className="fas fa-scroll text-stone-600"></i> Tavern Logs
        </h3>
        <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
          {gameState.history.slice().reverse().map((event, i) => {
            const isNewest = i === 0;
            return (
              <div 
                key={`${event.turn}-${event.actor}`} 
                className={`flex items-center gap-3 text-sm py-2 px-3 rounded-lg border-b border-stone-800/50 last:border-0 animate-log-row ${isNewest ? 'bg-stone-800/30' : ''}`}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                {/* Dice Indicator */}
                <i className={`
                  fas fa-dice text-lg animate-indicator-pop
                  ${event.actor === 'PLAYER' ? 'text-amber-500' : 'text-red-500'}
                  ${isNewest ? 'animate-indicator-pulse' : ''}
                `}></i>
                
                <span className="text-stone-400 font-bold whitespace-nowrap">{event.actor}:</span>
                <span className="text-stone-300 flex-1">
                  {event.action} as <span className="text-stone-100 font-mono font-bold">{event.claim}</span>
                </span>
                
                {event.wasTruth !== null && (
                  <span className={`
                    ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold tracking-tighter uppercase border
                    ${event.wasTruth 
                      ? 'bg-green-900/20 text-green-500 border-green-900/40' 
                      : 'bg-red-900/20 text-red-500 border-red-900/40'}
                  `}>
                    {event.wasTruth ? 'Truth' : 'Bluff'}
                  </span>
                )}
              </div>
            );
          })}
          {gameState.history.length === 0 && <p className="text-stone-700 italic text-sm pl-2">Waiting for the first roll of the night...</p>}
        </div>
      </div>

      <RulesModal 
        isOpen={showRules} 
        onClose={() => setShowRules(false)} 
      />
    </div>
  );
};
