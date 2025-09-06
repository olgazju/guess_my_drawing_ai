export enum GameState {
  START,
  GENERATING_IMAGES,
  SELECTING,
  DRAWING,
  SUBMITTING,
  SHOWING_RESULT,
  GAME_OVER,
  ERROR,
}

export interface Score {
  player: number;
  ai: number;
}

export interface GeneratedImage {
  prompt: string;
  base64: string;
}

export interface AiGuess {
  index: number;
  reasoning: string;
}
