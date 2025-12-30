
export enum GamePhase {
  WAITING = 'WAITING',
  ROLLING = 'ROLLING',
  CLAIMING = 'CLAIMING',
  DECIDING = 'DECIDING', // Player/AI decides to challenge or trust
  REVEALING = 'REVEALING'
}

export type DieResult = 1 | 2 | 3 | 4 | 5 | 6;

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GameState {
  playerScore: number;
  aiScore: number;
  lastClaim: number; // The score that needs to be beaten (e.g., 42, 66, 1000 for Meier)
  currentDice: [DieResult, DieResult] | null;
  currentTurn: 'PLAYER' | 'AI';
  phase: GamePhase;
  message: string;
  isLying: boolean;
  history: GameEvent[];
  difficulty: Difficulty;
}

export interface GameEvent {
  turn: number;
  actor: 'PLAYER' | 'AI';
  action: string;
  claim: string;
  wasTruth: boolean | null;
}
