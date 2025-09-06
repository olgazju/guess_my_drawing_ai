import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GameState, Score, GeneratedImage, AiGuess } from './types';
import { MAX_ROUNDS, ROUND_TIMER_SECONDS, MAX_LINES } from './constants';
import { generateImagesForGame, guessDrawing } from './services/geminiService';
import Canvas, { CanvasHandle } from './components/Canvas';
import ImageGrid from './components/ImageGrid';
import LoadingSpinner from './components/LoadingSpinner';

const getFriendlyErrorMessage = (error: unknown): string => {
    let message = "An unknown error occurred.";
    if (error instanceof Error) {
        message = error.message;
    } else if (typeof error === 'string') {
        message = error;
    }

    if (message.includes('quota') || message.includes('RESOURCE_EXHAUSTED') || message.includes('429')) {
        return "The application has exceeded its API usage quota. Please check your Google AI plan and billing details, or try again later.";
    }

    return `An unexpected error occurred. Please try again. Details: ${message}`;
};

const GameHeader: React.FC<{ round: number; score: Score, onRestart: () => void }> = ({ round, score, onRestart }) => (
    <div className="flex justify-between items-center mb-4 p-4 border-b-2 border-slate-200">
        <div className="flex items-center gap-4">
             <button 
                onClick={onRestart}
                className="bg-amber-500 text-white font-bold py-2 px-4 rounded-lg text-sm hover:bg-amber-600 transition-transform transform hover:scale-105 shadow-md"
                aria-label="Restart Game"
            >
                Restart
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-teal-800 hidden sm:block">Guess My Drawing</h1>
        </div>
        <div className="text-right">
            <div className="font-bold text-lg">Round: <span className="text-teal-600">{round}/{MAX_ROUNDS}</span></div>
            <div className="text-sm text-slate-500">Player: {score.player} | AI: {score.ai}</div>
        </div>
    </div>
);

const GameStatus: React.FC<{ gameState: GameState, errorMessage: string | null }> = ({ gameState, errorMessage }) => {
    const messages: { [key in GameState]?: string } = {
        [GameState.GENERATING_IMAGES]: "AI is creating images...",
        [GameState.SELECTING]: "Choose an image to draw!",
        [GameState.DRAWING]: "Draw in one line! You must click submit before time runs out!",
        [GameState.SUBMITTING]: "AI is analyzing your masterpiece...",
        [GameState.ERROR]: `An error occurred: ${errorMessage}`,
    };
    const message = messages[gameState];
    if (!message) return null;
    return <div className={`text-center text-lg font-medium p-3 rounded-md mb-4 ${gameState === GameState.ERROR ? 'bg-rose-100 text-rose-800' : 'bg-teal-100 text-teal-800'}`}>{message}</div>;
}

export default function App() {
    const [gameState, setGameState] = useState<GameState>(GameState.START);
    const [round, setRound] = useState(0);
    const [score, setScore] = useState<Score>({ player: 0, ai: 0 });
    const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
    const [aiGuess, setAiGuess] = useState<AiGuess | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(ROUND_TIMER_SECONDS);
    const [linesDrawn, setLinesDrawn] = useState(0);
    const canvasRef = useRef<CanvasHandle>(null);

    const handleStartGame = () => {
        setScore({ player: 0, ai: 0 });
        const firstRound = 1;
        setRound(firstRound);
        setLinesDrawn(0);
        startNewRound(firstRound);
    };

    const startNewRound = useCallback(async (currentRound: number) => {
        setGameState(GameState.GENERATING_IMAGES);
        setSelectedImageIndex(null);
        setAiGuess(null);
        canvasRef.current?.clear();
        setLinesDrawn(0);
        setErrorMessage(null);
        try {
            const images = await generateImagesForGame(currentRound);
            setGeneratedImages(images);
            setGameState(GameState.SELECTING);
        } catch (error) {
            console.error(error);
            setErrorMessage(getFriendlyErrorMessage(error));
            setGameState(GameState.ERROR);
        }
    }, []);

    const handleImageSelect = (index: number) => {
        if (gameState === GameState.SELECTING) {
            setSelectedImageIndex(index);
            setGameState(GameState.DRAWING);
        }
    };

    const handleSubmitDrawing = useCallback(async () => {
        if (gameState !== GameState.DRAWING || selectedImageIndex === null) {
            return;
        }
        setGameState(GameState.SUBMITTING);
        setErrorMessage(null);
        try {
            const sketchBase64 = canvasRef.current!.getDrawing();
            const responseText = await guessDrawing(sketchBase64, generatedImages);
            
            const lines = responseText.trim().split('\n');
            const guessIndex = parseInt(lines[0], 10) - 1;
            const reasoning = lines.slice(1).join('\n');
            
            if (isNaN(guessIndex) || guessIndex < -1 || guessIndex > 3) {
              throw new Error("AI returned an invalid guess index.");
            }

            setAiGuess({ index: guessIndex, reasoning });

            if (guessIndex === selectedImageIndex) {
                setScore(s => ({ ...s, player: s.player + 1 }));
            } else {
                setScore(s => ({ ...s, ai: s.ai + 1 }));
            }
            setGameState(GameState.SHOWING_RESULT);

        } catch (error) {
            console.error(error);
            setErrorMessage(getFriendlyErrorMessage(error));
            setGameState(GameState.ERROR);
        }
    }, [gameState, generatedImages, selectedImageIndex]);

    const handleNextRound = () => {
        if (round >= MAX_ROUNDS) {
            setGameState(GameState.GAME_OVER);
        } else {
            const nextRound = round + 1;
            setRound(nextRound);
            startNewRound(nextRound);
        }
    };
    
    const handleTimeout = useCallback(() => {
        if (gameState !== GameState.DRAWING) return;
        setScore(s => ({ ...s, ai: s.ai + 1 }));
        setAiGuess({ index: -2, reasoning: "Time's up! You didn't submit your drawing in time." });
        setGameState(GameState.SHOWING_RESULT);
    }, [gameState]);

    useEffect(() => {
        if (gameState === GameState.DRAWING) {
            const timerId = setInterval(() => {
                setTimeLeft(prevTime => {
                    if (prevTime <= 1) {
                        clearInterval(timerId);
                        return 0;
                    }
                    return prevTime - 1;
                });
            }, 1000);
            return () => clearInterval(timerId);
        } else {
            setTimeLeft(ROUND_TIMER_SECONDS);
        }
    }, [gameState]);

    useEffect(() => {
        if (timeLeft <= 0 && gameState === GameState.DRAWING) {
            handleTimeout();
        }
    }, [timeLeft, gameState, handleTimeout]);


    const renderContent = () => {
        switch (gameState) {
            case GameState.START:
                return <div className="text-center p-10 bg-white/70 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200">
                    <h2 className="text-4xl font-bold mb-4 text-teal-800">Welcome to Guess My Drawing!</h2>
                    <p className="text-slate-600 mb-2 max-w-md mx-auto">The AI will generate 4 images. You pick one, draw it, and see if the AI can guess which one you chose!</p>
                    <p className="text-slate-700 font-semibold mb-8 max-w-md mx-auto">Challenge: You must draw in <span className="text-teal-600">one continuous line</span> and you only have <span className="text-teal-600">{ROUND_TIMER_SECONDS} seconds</span>!</p>
                    <button onClick={handleStartGame} className="bg-teal-600 text-white font-bold py-3 px-8 rounded-lg text-xl hover:bg-teal-700 transition-transform transform hover:scale-105 shadow-lg">Start Game</button>
                </div>;

            case GameState.GAME_OVER:
                 const winnerMessage = score.player > score.ai ? "You Win! 🎉" : score.ai > score.player ? "The AI Wins! 🤖" : "It's a Tie! 🤝";
                return <div className="text-center p-10 bg-white/70 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200">
                    <h2 className="text-4xl font-bold mb-2">Game Over!</h2>
                     <p className="text-2xl font-semibold mb-4 text-teal-600">{winnerMessage}</p>
                    <p className="text-slate-600 mb-8 text-xl">Final Score: Player {score.player} - {score.ai} AI</p>
                    <button onClick={handleStartGame} className="bg-teal-600 text-white font-bold py-3 px-8 rounded-lg text-xl hover:bg-teal-700 transition-transform transform hover:scale-105 shadow-lg">Play Again</button>
                </div>;

            case GameState.ERROR:
                 return <div className="text-center p-10 bg-rose-50 rounded-2xl shadow-xl border border-rose-200">
                    <h2 className="text-4xl font-bold mb-4 text-rose-600">Something went wrong</h2>
                    <p className="text-slate-600 mb-8">{errorMessage}</p>
                    <button onClick={handleStartGame} className="bg-rose-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-rose-700 transition">Start Over</button>
                </div>;

            default:
                const isDrawingPhase = gameState === GameState.DRAWING;
                const isSelectionPhase = gameState === GameState.SELECTING;
                const isResultPhase = gameState === GameState.SHOWING_RESULT;
                const isLoading = gameState === GameState.GENERATING_IMAGES || gameState === GameState.SUBMITTING;
                const canStillDrawLines = linesDrawn < MAX_LINES;

                const getResultStyling = () => {
                    if (!aiGuess) return { title: "", className: "" };
                    if (aiGuess.index === selectedImageIndex) return { title: "✅ AI Guessed Correctly!", className: "text-emerald-600"};
                    if (aiGuess.index === -2) return { title: "⏰ Time's Up!", className: "text-slate-600" };
                    if (aiGuess.index === -1) return { title: "🤔 AI Gave Up!", className: "text-amber-600" };
                    return { title: "❌ AI Guessed Incorrectly!", className: "text-rose-600" };
                };
                const resultStyling = getResultStyling();

                return <>
                    <GameHeader round={round} score={score} onRestart={handleStartGame} />
                    <GameStatus gameState={gameState} errorMessage={errorMessage} />
                    <div className="grid md:grid-cols-2 gap-8 items-start">
                        <div className="flex flex-col gap-4">
                            <h2 className="text-2xl font-bold text-center text-slate-600">Reference Images</h2>
                            <ImageGrid
                                images={generatedImages}
                                onSelect={handleImageSelect}
                                canSelect={isSelectionPhase}
                                selectedImageIndex={selectedImageIndex}
                                aiGuessIndex={aiGuess?.index ?? null}
                                isResultState={isResultPhase}
                            />
                        </div>
                        <div className="flex flex-col gap-4">
                             <h2 className="text-2xl font-bold text-center text-slate-600">Your Canvas</h2>
                             <div className="aspect-square flex flex-col rounded-lg shadow-lg overflow-hidden border border-slate-200 bg-white">
                                <div className="relative flex-grow">
                                    {isDrawingPhase && (
                                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg flex items-center gap-6 border border-slate-200">
                                            <div>
                                                <div className={`text-3xl font-bold font-mono ${timeLeft <= 3 ? 'text-rose-500 animate-pulse' : 'text-slate-700'}`}>
                                                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                                                </div>
                                                <div className="text-xs text-center text-slate-500">TIME LEFT</div>
                                            </div>
                                            <div className="border-l border-slate-300 h-10"></div>
                                            <div>
                                                <div className={`text-3xl font-bold font-mono ${!canStillDrawLines ? 'text-rose-500' : 'text-slate-700'}`}>
                                                    {MAX_LINES - linesDrawn}
                                                </div>
                                                <div className="text-xs text-center text-slate-500">LINE LEFT</div>
                                            </div>
                                        </div>
                                    )}
                                    <Canvas
                                        ref={canvasRef}
                                        disabled={!isDrawingPhase}
                                        linesDrawn={linesDrawn}
                                        lineLimit={MAX_LINES}
                                        onLineEnd={() => setLinesDrawn(d => d + 1)}
                                    />
                                    {isLoading && <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center"><LoadingSpinner /></div>}
                                </div>
                                <div className="flex items-center justify-center gap-4 h-16 flex-shrink-0 bg-slate-50 border-t border-slate-200">
                                   {isDrawingPhase && <>
                                    <button
                                        onClick={() => {
                                            canvasRef.current?.clear();
                                            setLinesDrawn(0);
                                        }}
                                        className="bg-amber-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-amber-600 transition shadow-md">Clear</button>
                                    <button onClick={handleSubmitDrawing} className="bg-emerald-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-emerald-700 transition shadow-md">Submit</button>
                                   </>}
                                   {isResultPhase && <button onClick={handleNextRound} className="bg-teal-600 text-white font-bold py-2 px-8 rounded-lg hover:bg-teal-700 transition shadow-md">{round < MAX_ROUNDS ? "Next Round" : "See Final Score"}</button>}
                               </div>
                            </div>
                        </div>
                    </div>
                     {isResultPhase && aiGuess && (
                        <div className="mt-8 p-6 bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200">
                            <h3 className={`text-2xl font-bold text-center mb-2 ${resultStyling.className}`}>
                                {resultStyling.title}
                            </h3>
                            <p className="text-center text-slate-600 italic">"{aiGuess.reasoning}"</p>
                        </div>
                    )}
                </>;
        }
    };

    return (
        <main className="min-h-screen p-4 md:p-8 flex flex-col">
            <div className="w-full max-w-5xl mx-auto">
                {renderContent()}
            </div>
        </main>
    );
}