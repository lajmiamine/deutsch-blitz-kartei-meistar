import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  VocabularyWord,
  getVocabularyByDifficulty,
  updateWordStatistics,
  getAllSources,
  getApprovedVocabularyBySource,
  getApprovedVocabulary,
  getNonMasteredVocabulary,
  getNonMasteredVocabularyByDifficulty,
  getWordsByIds
} from "@/utils/vocabularyService";
import FlashcardComponent from "@/components/FlashcardComponent";
import { Check, X, ArrowRight } from "lucide-react";
import WordProgressDialog from "@/components/WordProgressDialog";
import VocabularyList from "@/components/VocabularyList";

interface GameSettings {
  selectionType: string;
  difficulty: string;
  source: string | undefined;
  direction: string;
  focusUnmastered: boolean;
}

type GameStatus = "settings" | "playing" | "complete" | "no-words" | "all-mastered";

const FlashcardGame: React.FC = () => {
  const [gameStatus, setGameStatus] = useState<GameStatus>("settings");
  const [settings, setSettings] = useState<GameSettings>({
    selectionType: "all-vocabulary",
    difficulty: "1",
    source: undefined,
    direction: "german-to-english",
    focusUnmastered: false,
  });
  const [unmasteredWords, setUnmasteredWords] = useState<VocabularyWord[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const [correctAnswers, setCorrectAnswers] = useState<number>(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState<number>(0);
  const [masteredCount, setMasteredCount] = useState<number>(0);
  const [totalWords, setTotalWords] = useState<number>(0);
  const [sources, setSources] = useState<string[]>([]);
  
  // Add these new states for individual word selection
  const [selectedWords, setSelectedWords] = useState<VocabularyWord[]>([]);
  const [selectedWordIds, setSelectedWordIds] = useState<string[]>([]);
  const [showWordSelection, setShowWordSelection] = useState(false);
  
  const { selectionType, difficulty, source, direction, focusUnmastered } = settings;

  useEffect(() => {
    const availableSources = getAllSources();
    setSources(availableSources);
  }, []);

  const getInitialWords = useCallback(() => {
    if (selectionType === "all-vocabulary") {
      return getApprovedVocabulary();
    } else if (selectionType === "individual-words") {
      return selectedWords;
    } else if (selectionType === "by-difficulty") {
      return getVocabularyByDifficulty(parseInt(difficulty));
    } else if (selectionType === "by-source") {
      return getApprovedVocabularyBySource(source || "");
    } else if (selectionType === "non-mastered") {
      if (difficulty === "0") {
        return getNonMasteredVocabulary();
      } else {
        return getNonMasteredVocabularyByDifficulty(parseInt(difficulty));
      }
    }
    return [];
  }, [selectionType, difficulty, source, selectedWords]);

  const handleEndGame = () => {
    setGameStatus("settings");
  };

  const handleNextCard = () => {
    selectNextUnmasteredWord();
  };
  
  const selectNextUnmasteredWord = useCallback(() => {
    // If no unmastered words left, game is complete
    if (unmasteredWords.length === 0) {
      setGameStatus("complete");
      return;
    }

    // Find the next index, starting from current + 1 or wrapping to beginning
    let nextIndex = 0;
    if (unmasteredWords.length > 0) {
      nextIndex = Math.floor(Math.random() * unmasteredWords.length);
    }

    setCurrentWordIndex(nextIndex);
  }, [unmasteredWords]);

  // Handle individual word selection
  const handleWordSelection = (id: string, selected: boolean) => {
    if (selected) {
      setSelectedWordIds(prev => [...prev, id]);
    } else {
      setSelectedWordIds(prev => prev.filter(wordId => wordId !== id));
    }
  };

  // Load selected words when selectedWordIds changes
  useEffect(() => {
    if (selectionType === "individual-words" && selectedWordIds.length > 0) {
      const words = getWordsByIds(selectedWordIds);
      setSelectedWords(words);
    }
  }, [selectedWordIds, selectionType]);

  const setSelectionType = (type: string) => {
    setSettings(prev => ({ ...prev, selectionType: type }));
  };

  const setDifficulty = (diff: string) => {
    setSettings(prev => ({ ...prev, difficulty: diff }));
  };

  const setSource = (src: string) => {
    setSettings(prev => ({ ...prev, source: src }));
  };

  const setDirection = (dir: string) => {
    setSettings(prev => ({ ...prev, direction: dir }));
  };

  const setFocusUnmastered = (focus: boolean) => {
    setSettings(prev => ({ ...prev, focusUnmastered: focus }));
  };

  // Start the game with selected settings
  const startGame = () => {
    if (selectionType === "individual-words" && selectedWordIds.length === 0) {
      setShowWordSelection(true);
      return;
    }

    // Initialize game with selected words
    const initialWords = getInitialWords();
    
    if (initialWords.length === 0) {
      setGameStatus("no-words");
      return;
    }
    
    // Filter for unmastered words if focusing on unmastered words
    const filteredWords = focusUnmastered ? 
      initialWords.filter(word => !word.mastered) : 
      initialWords;
    
    if (filteredWords.length === 0) {
      setGameStatus("all-mastered");
      return;
    }
    
    setUnmasteredWords(filteredWords);
    setTotalWords(filteredWords.length);
    
    // Start with a random word
    const startIndex = Math.floor(Math.random() * filteredWords.length);
    setCurrentWordIndex(startIndex);
    
    setGameStatus("playing");
    
    // Reset counters
    setCorrectAnswers(0);
    setIncorrectAnswers(0);
    setMasteredCount(0);
  };

  // Handle answer checked event
  const handleAnswerChecked = (wordId: string, isCorrect: boolean) => {
    // Update statistics for the word
    const updatedWord = updateWordStatistics(wordId, isCorrect);
    
    // Update local state counters
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
    } else {
      setIncorrectAnswers(prev => prev + 1);
    }
    
    // Check if word became mastered with this answer
    if (updatedWord?.mastered && 
        !unmasteredWords.find(w => w.id === wordId)?.mastered) {
      setMasteredCount(prev => prev + 1);
    }
    
    // Update the unmasteredWords array with the updated word
    setUnmasteredWords(prev => 
      prev.map(word => word.id === wordId ? 
        { ...word, 
          mastered: updatedWord?.mastered || false,
          timesCorrect: updatedWord?.timesCorrect || word.timesCorrect,
          timesIncorrect: updatedWord?.timesIncorrect || word.timesIncorrect,
          correctStreak: updatedWord?.correctStreak || 0
        } : word
      )
    );
    
    // If focusing on unmastered and the word is now mastered, remove it
    if (focusUnmastered && updatedWord?.mastered) {
      setUnmasteredWords(prev => prev.filter(w => w.id !== wordId));
    }
    
    // Select next word
    setTimeout(() => {
      selectNextUnmasteredWord();
    }, 500);
  };

  // Toggle word selection mode
  const toggleWordSelectionMode = () => {
    setShowWordSelection(!showWordSelection);
  };

  // Start game with selected words
  const startGameWithSelectedWords = () => {
    if (selectedWordIds.length === 0) {
      return; // Don't start if no words are selected
    }
    setShowWordSelection(false);
    startGame();
  };

  // Render function
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">German Vocabulary Flashcards</h1>
      
      {/* Settings Panel */}
      {gameStatus !== "playing" && (
        <div className="space-y-4 p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-sm">
          <h2 className="text-lg font-medium">Game Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Word Selection Type */}
            <div>
              <label className="block text-sm font-medium mb-1">Select words by</label>
              <Select 
                value={selectionType} 
                onValueChange={setSelectionType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a selection method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-vocabulary">All vocabulary</SelectItem>
                  <SelectItem value="by-difficulty">By difficulty</SelectItem>
                  <SelectItem value="by-source">By source</SelectItem>
                  <SelectItem value="non-mastered">Non-mastered words</SelectItem>
                  <SelectItem value="individual-words">Select individual words</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Difficulty Selector */}
            {(selectionType === "by-difficulty" || (selectionType === "non-mastered" && difficulty !== "0")) && (
              <div>
                <label className="block text-sm font-medium mb-1">Difficulty</label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Easy</SelectItem>
                    <SelectItem value="2">Medium</SelectItem>
                    <SelectItem value="3">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Source Selector */}
            {selectionType === "by-source" && sources.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-1">Source</label>
                <Select value={source || ""} onValueChange={setSource}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {sources.map(src => (
                      <SelectItem key={src} value={src}>{src}</SelectItem>
                    ))}
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Individual words selection button */}
            {selectionType === "individual-words" && (
              <div className="md:col-span-2">
                <div className="flex flex-col space-y-2">
                  <Button onClick={toggleWordSelectionMode} className="mt-2">
                    {showWordSelection ? "Hide word selection" : "Select words"} 
                    ({selectedWordIds.length} selected)
                  </Button>
                </div>
              </div>
            )}
            
            {/* Direction Selector */}
            <div>
              <label className="block text-sm font-medium mb-1">Direction</label>
              <Select value={direction} onValueChange={setDirection}>
                <SelectTrigger>
                  <SelectValue placeholder="Select direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="german-to-english">German → English</SelectItem>
                  <SelectItem value="english-to-german">English → German</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Focus on Unmastered */}
            <div className="flex items-center space-x-2 md:col-span-2">
              <Checkbox 
                id="focus-unmastered" 
                checked={focusUnmastered}
                onCheckedChange={(checked) => setFocusUnmastered(checked === true)}
              />
              <label 
                htmlFor="focus-unmastered"
                className="text-sm cursor-pointer"
              >
                Focus on unmastered words (remove mastered words during play)
              </label>
            </div>
          </div>
          
          {/* Word Selection List */}
          {selectionType === "individual-words" && showWordSelection && (
            <div className="mt-4 border p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-2">Select words for your game</h3>
              <VocabularyList
                isSelectable={true}
                selectedWordIds={selectedWordIds}
                onWordSelect={handleWordSelection}
                onApproveWord={() => {}} // Not used in this context
                onDeleteWord={() => {}} // Not used in this context
                onEditWord={() => {}} // Not used in this context
              />
              
              <div className="mt-4 flex justify-end">
                <Button 
                  onClick={startGameWithSelectedWords}
                  disabled={selectedWordIds.length === 0}
                >
                  Start Game with Selected Words ({selectedWordIds.length})
                </Button>
              </div>
            </div>
          )}
          
          {/* Start Game Button */}
          <div className="mt-4 flex justify-center">
            {selectionType !== "individual-words" || !showWordSelection ? (
              <Button 
                onClick={startGame} 
                size="lg" 
                className="px-8"
              >
                Start Game
              </Button>
            ) : null}
          </div>
        </div>
      )}
      
      {/* Game Status Messages */}
      {gameStatus === "no-words" && (
        <div className="text-center p-6 bg-amber-50 border border-amber-200 rounded-lg mt-4">
          <h3 className="text-lg font-medium text-amber-700">No words available</h3>
          <p className="text-amber-600 mt-2">
            There are no words available with the selected criteria. Please change your selection.
          </p>
        </div>
      )}
      
      {gameStatus === "all-mastered" && (
        <div className="text-center p-6 bg-green-50 border border-green-200 rounded-lg mt-4">
          <h3 className="text-lg font-medium text-green-700">All words mastered!</h3>
          <p className="text-green-600 mt-2">
            You have mastered all the words in this selection. Try a different set of words or reset mastery progress.
          </p>
          <div className="mt-4">
            <WordProgressDialog />
          </div>
        </div>
      )}
      
      {/* Game Play UI */}
      {gameStatus === "playing" && (
        <div className="space-y-6">
          {/* Game Stats */}
          <div className="flex flex-col md:flex-row justify-between p-4 bg-white dark:bg-gray-800 border rounded-lg shadow-sm">
            <div className="flex space-x-4 mb-4 md:mb-0">
              <div className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-1" />
                <span>{correctAnswers} correct</span>
              </div>
              
              <div className="flex items-center">
                <X className="h-5 w-5 text-red-500 mr-1" />
                <span>{incorrectAnswers} incorrect</span>
              </div>
              
              <div className="flex items-center">
                <ArrowRight className="h-5 w-5 text-blue-500 mr-1" />
                <span>Mastered: {masteredCount}/{totalWords} words</span>
              </div>
            </div>
            
            <div>
              <Button 
                variant="outline"
                onClick={handleEndGame}
              >
                End Game
              </Button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="p-4 bg-white dark:bg-gray-800 border rounded-lg shadow-sm">
            <div className="mb-2 flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round((masteredCount / totalWords) * 100)}%</span>
            </div>
            
            <Progress 
              value={(masteredCount / totalWords) * 100}
              className="h-2"
            />
          </div>
          
          {/* Flashcard */}
          <div className="flex justify-center">
            {/* Make sure currentWordIndex is valid before rendering FlashcardComponent */}
            {currentWordIndex >= 0 && currentWordIndex < unmasteredWords.length ? (
              <FlashcardComponent
                word={unmasteredWords[currentWordIndex]}
                direction={direction}
                onCorrect={(wordId) => handleAnswerChecked(wordId, true)}
                onIncorrect={(wordId) => handleAnswerChecked(wordId, false)}
                onSkip={handleNextCard}
              />
            ) : (
              // Fallback if currentWordIndex is invalid
              <div className="text-center py-8">
                <p className="text-lg font-medium dark:text-white">
                  Loading next word...
                </p>
                <Button 
                  onClick={() => selectNextUnmasteredWord()} 
                  className="mt-4">
                    Find Next Word
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Game Complete UI */}
      {gameStatus === "complete" && (
        <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-lg mt-4">
          <h3 className="text-xl font-bold text-green-700 dark:text-green-400">Game Complete!</h3>
          <div className="mt-4 space-y-2">
            <p><span className="font-medium">Correct answers:</span> {correctAnswers}</p>
            <p><span className="font-medium">Incorrect answers:</span> {incorrectAnswers}</p>
            <p><span className="font-medium">Words mastered:</span> {masteredCount} out of {totalWords}</p>
          </div>
          <div className="mt-6 space-x-3">
            <Button onClick={() => setGameStatus("settings")}>
              New Game
            </Button>
            <Button variant="outline" onClick={handleEndGame}>
              Return to Settings
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashcardGame;
