import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import FlashcardComponent from "@/components/FlashcardComponent";
import WordProgressDialog from "@/components/WordProgressDialog";
import { 
  VocabularyWord, 
  getApprovedVocabulary, 
  getVocabularyByDifficulty, 
  getAllSources,
  getApprovedVocabularyBySource,
  getWordCountByDifficulty,
  getWordsByIds
} from "@/utils/vocabularyService";
import { CircleCheck, X, RefreshCw, Play, Trophy, BarChart, Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

const FlashcardGame = () => {
  const { toast } = useToast();
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [filteredWords, setFilteredWords] = useState<VocabularyWord[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [direction, setDirection] = useState<"german-to-english" | "english-to-german">("german-to-english");
  const [sources, setSources] = useState<string[]>([]);
  const [selectedSource, setSelectedSource] = useState<string | undefined>(undefined);
  const [wordCounts, setWordCounts] = useState<{easy: number, medium: number, hard: number}>({
    easy: 0,
    medium: 0,
    hard: 0
  });
  
  // Word selection mode
  const [selectionMode, setSelectionMode] = useState<"source" | "individual">("source");
  const [selectedWordIds, setSelectedWordIds] = useState<string[]>([]);
  const [showWordSelector, setShowWordSelector] = useState<boolean>(false);
  
  // Track session progress - NOT persisted in localStorage
  const [correctAnswers, setCorrectAnswers] = useState<string[]>([]);
  const [incorrectAnswers, setIncorrectAnswers] = useState<string[]>([]);
  const [answeredCount, setAnsweredCount] = useState<number>(0);
  const [gameSessionWords, setGameSessionWords] = useState<VocabularyWord[]>([]);
  
  // Game-session only mastery tracking - NOT persisted in localStorage
  const [sessionMasteredWords, setSessionMasteredWords] = useState<string[]>([]);
  const [sessionWordStats, setSessionWordStats] = useState<Map<string, {
    timesCorrect: number;
    timesIncorrect: number;
    correctStreak: number;
    mastered: boolean;
  }>>(new Map());
  
  // Track unmastered words to focus on
  const [unmasteredWords, setUnmasteredWords] = useState<VocabularyWord[]>([]);
  
  // Game state
  const [gameActive, setGameActive] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);
  const [gameEndTime, setGameEndTime] = useState<number | null>(null);
  
  // Create a ref to track when we need to reload words after source/difficulty changes
  const shouldReloadWords = useRef(false);

  // Load vocabulary when component mounts
  useEffect(() => {
    // Check if a source was selected in the admin panel
    const preselectedSource = localStorage.getItem("flashcard_source");
    if (preselectedSource) {
      setSelectedSource(preselectedSource);
      // Clear it so it doesn't affect future visits
      localStorage.removeItem("flashcard_source");
    }
    
    const allSources = getAllSources();
    setSources(allSources);
    
    loadWords();
  }, []);

  // Update filtered words when selection criteria change
  useEffect(() => {
    if (shouldReloadWords.current) {
      loadWords();
      shouldReloadWords.current = false;
    } else {
      filterWords();
    }
  }, [selectedDifficulty, words, selectedSource, selectionMode, selectedWordIds]);

  const loadWords = () => {
    let loadedWords: VocabularyWord[] = [];
    
    if (selectedSource) {
      if (selectedSource === "other") {
        // Get words without any source
        loadedWords = getApprovedVocabulary().filter(word => !word.source);
      } else {
        // Get words from a specific source
        loadedWords = getApprovedVocabularyBySource(selectedSource);
      }
    } else {
      // Get all approved vocabulary
      loadedWords = getApprovedVocabulary();
    }
    
    setWords(loadedWords);
    
    // Update word counts with the current source selection
    const counts = getWordCountByDifficulty(selectedSource);
    setWordCounts(counts);
    
    if (loadedWords.length === 0) {
      toast({
        title: "No Words Available",
        description: "There are no approved vocabulary words. Please add some in the admin panel.",
        variant: "destructive",
      });
    }
  };

  const filterWords = () => {
    if (words.length === 0) return;
    
    let filtered: VocabularyWord[] = [];
    
    if (selectionMode === "individual" && selectedWordIds.length > 0) {
      // Filter by selected individual words
      filtered = getWordsByIds(selectedWordIds);
    } else {
      // Filter by source and difficulty
      filtered = [...words];
      
      // Apply difficulty filter
      if (selectedDifficulty !== "all") {
        const difficultyLevel = parseInt(selectedDifficulty);
        filtered = filtered.filter(word => word.difficulty === difficultyLevel);
      }
    }
    
    // Remove mastery filtering - we'll track mastery only in the session now
    
    // Shuffle the array for random order
    filtered.sort(() => Math.random() - 0.5);
    
    setFilteredWords(filtered);
    setCurrentWordIndex(0);
    
    if (filtered.length === 0) {
      toast({
        title: "No Words Match Criteria",
        description: `There are no ${
          selectedDifficulty === "1" ? "easy" : 
          selectedDifficulty === "2" ? "medium" : 
          selectedDifficulty === "3" ? "hard" : ""
        } words available${selectedSource ? ` in "${selectedSource}"` : ""}.`,
        variant: "destructive",
      });
    }
  };

  const handleSourceChange = (value: string | undefined) => {
    setSelectedSource(value);
    shouldReloadWords.current = true; // Flag to reload words on next effect
    
    // Reset individual word selection when source changes
    setSelectedWordIds([]);
    
    // Reset progress tracking when source changes
    resetGameProgress();
  };

  const handleDifficultyChange = (value: string) => {
    setSelectedDifficulty(value);
    
    // Reset progress tracking when difficulty changes
    resetGameProgress();
  };

  const handleDirectionChange = (value: "german-to-english" | "english-to-german") => {
    setDirection(value);
  };

  const handleSelectionModeChange = (value: "source" | "individual") => {
    setSelectionMode(value);
    
    // Reset selected words when changing mode
    if (value === "source") {
      setSelectedWordIds([]);
    }
    
    // Reset progress tracking when selection mode changes
    resetGameProgress();
  };

  const toggleWordSelection = (wordId: string) => {
    setSelectedWordIds(prev => {
      if (prev.includes(wordId)) {
        return prev.filter(id => id !== wordId);
      } else {
        return [...prev, wordId];
      }
    });
  };

  // Update word statistics in the session only, not in localStorage
  const updateSessionWordStatistics = (wordId: string, wasCorrect: boolean): VocabularyWord | null => {
    // Find the word in our filtered words list
    const wordToUpdate = filteredWords.find(word => word.id === wordId);
    if (!wordToUpdate) return null;
    
    // Get the current stats from our session state or create new ones
    const currentStats = sessionWordStats.get(wordId) || {
      timesCorrect: 0,
      timesIncorrect: 0,
      correctStreak: 0,
      mastered: false
    };
    
    // Update the stats
    const updatedStats = {
      timesCorrect: wasCorrect ? currentStats.timesCorrect + 1 : currentStats.timesCorrect,
      timesIncorrect: wasCorrect ? currentStats.timesIncorrect : currentStats.timesIncorrect + 1,
      correctStreak: wasCorrect ? currentStats.correctStreak + 1 : 0, // Reset streak on incorrect
      mastered: currentStats.mastered // Will be updated below
    };
    
    // Determine mastery status based on the streak
    // Mastery requires 2 consecutive correct answers
    // If they've had an incorrect answer, requires 3 consecutive correct answers
    if (updatedStats.timesIncorrect > 0 && updatedStats.correctStreak >= 3) {
      updatedStats.mastered = true;
    } else if (updatedStats.timesIncorrect === 0 && updatedStats.correctStreak >= 2) {
      updatedStats.mastered = true;
    }
    
    // Save the updated stats to our session state
    const newSessionWordStats = new Map(sessionWordStats);
    newSessionWordStats.set(wordId, updatedStats);
    setSessionWordStats(newSessionWordStats);
    
    // Create a copy of the word with updated session-only stats
    const updatedWord: VocabularyWord = {
      ...wordToUpdate,
      timesCorrect: updatedStats.timesCorrect,
      timesIncorrect: updatedStats.timesIncorrect,
      correctStreak: updatedStats.correctStreak,
      mastered: updatedStats.mastered
    };
    
    return updatedWord;
  };

  const handleAnswerChecked = (cardId: string, wasCorrect: boolean) => {
    // Update session word statistics and get the updated word
    const updatedWord = updateSessionWordStatistics(cardId, wasCorrect);
    
    // Update session progress
    setAnsweredCount(prev => prev + 1);
    
    if (updatedWord && updatedWord.mastered) {
      const wasAlreadyMastered = sessionMasteredWords.includes(cardId);
      
      if (!wasAlreadyMastered) {
        // Word just became mastered in this session
        setSessionMasteredWords(prev => [...prev, cardId]);
        
        // Update unmastered words list - REMOVE THE WORD IMMEDIATELY
        setUnmasteredWords(prev => prev.filter(w => w.id !== cardId));
        
        toast({
          title: "Word Mastered!",
          description: "Great job! You've mastered this word.",
          variant: "default",
          duration: 2000,
        });
      }
    }
    
    if (wasCorrect) {
      setCorrectAnswers(prev => [...prev, cardId]);
    } else {
      setIncorrectAnswers(prev => [...prev, cardId]);
    }
    
    // Show feedback
    toast({
      title: wasCorrect ? "Correct!" : "Incorrect",
      description: wasCorrect ? "Great job!" : "Don't worry, keep practicing!",
      variant: wasCorrect ? "default" : "destructive",
      duration: 1500,
    });

    // Simply call selectNextUnmasteredWord to continue the game
    selectNextUnmasteredWord();
  };

  const selectNextUnmasteredWord = () => {
    console.log("Selecting next unmastered word, remaining:", unmasteredWords.length);
    
    // If there are no more unmastered words, show completion message but don't end game
    if (unmasteredWords.length === 0) {
      console.log("No more unmastered words left");
      // Only end the game when there are truly no unmastered words left
      endGame();
      return;
    }
    
    // Pick a random unmastered word for better learning outcomes
    const randomIndex = Math.floor(Math.random() * unmasteredWords.length);
    setCurrentWordIndex(randomIndex);
    console.log(`Selected unmastered word index ${randomIndex}`);
  };

  const handleNextCard = () => {
    selectNextUnmasteredWord();
  };
  
  const handleResetGame = () => {
    // Reset the game session stats without affecting localStorage
    resetSessionProgress();
    
    toast({
      title: "Game Reset",
      description: "Your progress has been reset for this game session.",
      duration: 2000,
    });
    
    // Apply session mastery status to filtered words (all words start unmastered in a new game)
    const wordsWithSessionStatus = filteredWords.map(word => ({
      ...word,
      mastered: false,  // Explicitly set to false for all words
      timesCorrect: 0,  // Reset correct count
      timesIncorrect: 0, // Reset incorrect count
      correctStreak: 0   // Reset streak count
    }));
    
    // Set all words as unmastered for this reset
    setUnmasteredWords(wordsWithSessionStatus);
    console.log("Reset game with unmastered words:", wordsWithSessionStatus.length);
    
    // Randomize the first word to show
    if (wordsWithSessionStatus.length > 0) {
      const randomIndex = Math.floor(Math.random() * wordsWithSessionStatus.length);
      setCurrentWordIndex(randomIndex);
    } else {
      setCurrentWordIndex(0);
    }
    
    // Update the game session words with all mastery reset
    setGameSessionWords(wordsWithSessionStatus);
    
    // Make sure to reset all session mastery tracking
    setSessionMasteredWords([]);
    setSessionWordStats(new Map());
    
    // Force the WordProgressDialog to update with reset data by setting a completely new array
    // This ensures React detects the change and updates the component
    setGameSessionWords([...wordsWithSessionStatus]);
  };
  
  // Reset game progress completely for the session only
  const resetGameProgress = () => {
    // Reset all progress tracking for the session
    setCorrectAnswers([]);
    setIncorrectAnswers([]);
    setAnsweredCount(0);
    setSessionMasteredWords([]);
    setSessionWordStats(new Map());
    setGameActive(false);
    setShowResults(false);
    setGameStartTime(null);
    setGameEndTime(null);
  };
  
  // Reset only the session progress, not the game state
  const resetSessionProgress = () => {
    setCorrectAnswers([]);
    setIncorrectAnswers([]);
    setAnsweredCount(0);
    setSessionMasteredWords([]);
    setSessionWordStats(new Map());
  };
  
  // Apply session mastery status to the words list
  const applySessionMasteryStatus = (wordsList: VocabularyWord[]): VocabularyWord[] => {
    return wordsList.map(word => {
      const stats = sessionWordStats.get(word.id);
      if (!stats) return word;
      
      return {
        ...word,
        timesCorrect: stats.timesCorrect,
        timesIncorrect: stats.timesIncorrect,
        correctStreak: stats.correctStreak,
        mastered: stats.mastered
      };
    });
  };
  
  // Start game function
  const startGame = () => {
    if (filteredWords.length === 0) {
      toast({
        title: "No Words Available",
        description: "Please select a source or difficulty that contains words.",
        variant: "destructive",
      });
      return;
    }
    
    setGameActive(true);
    setShowResults(false);
    setGameStartTime(Date.now());
    setGameEndTime(null);
    
    // Reset progress for a new game session
    resetSessionProgress();
    
    // Apply session mastery status to filtered words (all words start unmastered in a new game)
    // Important: Make sure all words start with mastered=false and reset all progress counters
    const wordsWithSessionStatus = filteredWords.map(word => ({
      ...word,
      mastered: false,  // Explicitly set to false for all words
      timesCorrect: 0,  // Reset correct count
      timesIncorrect: 0, // Reset incorrect count
      correctStreak: 0   // Reset streak count
    }));
    
    // Set all words as unmastered at the start of a new game
    setUnmasteredWords(wordsWithSessionStatus);
    console.log("Starting game with unmastered words:", wordsWithSessionStatus.length);
    
    // Randomize the first word to show
    if (wordsWithSessionStatus.length > 0) {
      const randomIndex = Math.floor(Math.random() * wordsWithSessionStatus.length);
      setCurrentWordIndex(randomIndex);
      console.log(`Initial unmastered word index: ${randomIndex}`);
    } else {
      setCurrentWordIndex(0);
    }
    
    // Save the filtered words for this game session with all mastery reset
    setGameSessionWords(wordsWithSessionStatus);
    
    toast({
      title: "Game Started",
      description: `Focus on mastering ${wordsWithSessionStatus.length} words in this session!`,
      duration: 2000,
    });
  };
  
  // End game function with progress reset
  const endGame = () => {
    setGameActive(false);
    setShowResults(true);
    setGameEndTime(Date.now());
    
    // Keep game session words for stats
    // We're not persisting mastery progress to localStorage anymore
  };
  
  // Calculate game statistics
  const calculateGameStats = () => {
    const totalCards = filteredWords.length;
    const correctCount = correctAnswers.length;
    const incorrectCount = incorrectAnswers.length;
    const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
    
    let timeTaken = 0;
    if (gameStartTime && gameEndTime) {
      timeTaken = Math.floor((gameEndTime - gameStartTime) / 1000); // in seconds
    }
    
    return {
      totalCards,
      correctCount,
      incorrectCount,
      accuracy,
      timeTaken,
    };
  };
  
  // Format time in minutes and seconds
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };
  
  // Calculate mastery progress percentage based on session-only mastery
  const masteryProgressPercentage = filteredWords.length > 0 
    ? Math.round((sessionMasteredWords.length * 100) / filteredWords.length) 
    : 0;

  // Get text for source display
  const getSourceDisplayText = () => {
    if (selectionMode === "individual") {
      return `${selectedWordIds.length} selected words`;
    }
    
    if (selectedSource === "other") {
      return "Words with no source";
    }
    
    return selectedSource || "All words";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="container py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 dark:text-white">Flashcard Game</h1>
        
        {/* Word Selection UI - shown when not in active game */}
        {!gameActive && !showResults && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-white">Selection Mode</CardTitle>
                <CardDescription className="dark:text-gray-300">How would you like to select words?</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup 
                  value={selectionMode} 
                  onValueChange={(value: "source" | "individual") => handleSelectionModeChange(value)} 
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="source" id="by-source" />
                    <Label htmlFor="by-source" className="dark:text-gray-200">By source & difficulty</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="individual" id="by-individual" />
                    <Label htmlFor="by-individual" className="dark:text-gray-200">Select individual words</Label>
                  </div>
                </RadioGroup>
                
                {selectionMode === "individual" && (
                  <div className="mt-4">
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => setShowWordSelector(true)}
                      className="w-full"
                    >
                      Select Words ({selectedWordIds.length} selected)
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {selectionMode === "source" && (
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="dark:text-white">Source</CardTitle>
                  <CardDescription className="dark:text-gray-300">Select vocabulary source</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select 
                    value={selectedSource} 
                    onValueChange={handleSourceChange}
                  >
                    <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                      <SelectValue placeholder="All words" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-700">
                      <SelectItem value={undefined}>All words</SelectItem>
                      <SelectItem value="other">No source (Other)</SelectItem>
                      {sources.map(source => (
                        <SelectItem key={source} value={source}>{source}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-white">Difficulty</CardTitle>
                <CardDescription className="dark:text-gray-300">Filter words by difficulty</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup 
                  value={selectedDifficulty} 
                  onValueChange={handleDifficultyChange} 
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="all" />
                    <Label htmlFor="all" className="dark:text-gray-200">All Difficulties ({filteredWords.length} words)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1" id="easy" />
                    <Label htmlFor="easy" className="dark:text-gray-200">Easy ({wordCounts.easy} words)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="2" id="medium" />
                    <Label htmlFor="medium" className="dark:text-gray-200">Medium ({wordCounts.medium} words)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="3" id="hard" />
                    <Label htmlFor="hard" className="dark:text-gray-200">Hard ({wordCounts.hard} words)</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-white">Direction</CardTitle>
                <CardDescription className="dark:text-gray-300">Choose translation direction</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup 
                  value={direction} 
                  onValueChange={(value: "german-to-english" | "english-to-german") => handleDirectionChange(value)} 
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="german-to-english" id="german-to-english" />
                    <Label htmlFor="german-to-english" className="dark:text-gray-200">German → English</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="english-to-german" id="english-to-german" />
                    <Label htmlFor="english-to-german" className="dark:text-gray-200">English → German</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Game Info Badge */}
        {gameActive && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="secondary" className="text-sm py-1 px-3">
                Source: {getSourceDisplayText()}
              </Badge>
              <Badge variant="secondary" className="text-sm py-1 px-3">
                {selectedDifficulty === "all" ? "All Difficulties" : 
                  selectedDifficulty === "1" ? "Easy" : 
                  selectedDifficulty === "2" ? "Medium" : "Hard"}
              </Badge>
              <Badge variant="secondary" className="text-sm py-1 px-3">
                {direction === "german-to-english" ? "German → English" : "English → German"}
              </Badge>
              <Badge variant="secondary" className="text-sm py-1 px-3">
                {filteredWords.length} Words
              </Badge>
            </div>
          </div>
        )}
        
        {/* Progress Tracking Section */}
        {(gameActive || showResults) && (
          <Card className="mb-6 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg dark:text-white">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm mb-1 dark:text-gray-300">
                  <span>Mastered: {sessionMasteredWords.length}/{filteredWords.length} words</span>
                  <span>{masteryProgressPercentage}%</span>
                </div>
                <Progress value={masteryProgressPercentage} className="h-2" />
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-1">
                      <CircleCheck className="h-4 w-4 text-green-600" />
                      <span className="text-sm dark:text-gray-200">{correctAnswers.length} correct</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <X className="h-4 w-4 text-red-600" />
                      <span className="text-sm dark:text-gray-200">{incorrectAnswers.length} incorrect</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {/* Word Progress Dialog - now with gameSessionOnly prop */}
                    <WordProgressDialog 
                      words={applySessionMasteryStatus(filteredWords)} 
                      gameSessionOnly={true} 
                    />
                    
                    {gameActive && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleResetGame}
                        className="flex items-center gap-1 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Reset
                      </Button>
                    )}
                    {gameActive && (
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={endGame}
                        className="flex items-center gap-1"
                      >
                        <Trophy className="h-3 w-3" />
                        End Game
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Game Results Dialog */}
        <Dialog open={showResults} onOpenChange={setShowResults}>
          <DialogContent className="sm:max-w-md dark:bg-gray-800 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-center text-2xl dark:text-white">Game Results</DialogTitle>
            </DialogHeader>
            
            {/* Display correct and incorrect counts prominently at the top */}
            <div className="flex justify-center gap-8 my-4">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <Check className="h-5 w-5" />
                  <span className="text-3xl font-bold">{calculateGameStats().correctCount}</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Correct</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                  <X className="h-5 w-5" />
                  <span className="text-3xl font-bold">{calculateGameStats().incorrectCount}</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Incorrect</p>
              </div>
            </div>
            
            <DialogDescription className="text-center dark:text-gray-300">
              {calculateGameStats().accuracy >= 80 ? 
                "Great job! You've mastered these words." : 
                calculateGameStats().accuracy >= 50 ? 
                "Good effort! Keep practicing to improve." :
                "Keep practicing! You'll get better with time."}
            </DialogDescription>
            
            <div className="grid grid-cols-2 gap-4 my-4">
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg text-center">
                <p className="text-3xl font-bold dark:text-white">{calculateGameStats().accuracy}%</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Accuracy</p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg text-center">
                <p className="text-3xl font-bold dark:text-white">{formatTime(calculateGameStats().timeTaken)}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Time</p>
              </div>
            </div>
            
            <div className="flex justify-center gap-4 mt-4">
              <Button
                variant="default"
                onClick={() => {
                  setShowResults(false);
                  startGame();
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Play Again
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowResults(false);
                }}
                className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              >
                Select Words
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Word Selector Dialog */}
        <Dialog open={showWordSelector} onOpenChange={setShowWordSelector}>
          <DialogContent className="sm:max-w-md max-h-[80vh] dark:bg-gray-800 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-center dark:text-white">Select Words</DialogTitle>
              <DialogDescription className="text-center dark:text-gray-300">
                Choose individual words for your flashcard game
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm dark:text-gray-300">
                Selected: {selectedWordIds.length} words
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedWordIds([])}
                disabled={selectedWordIds.length === 0}
              >
                Clear All
              </Button>
            </div>
            
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {words.map(word => (
                  <div 
                    key={word.id}
                    className="flex items-center space-x-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Checkbox
                      id={`word-${word.id}`}
                      checked={selectedWordIds.includes(word.id)}
                      onCheckedChange={() => toggleWordSelection(word.id)}
                    />
                    <div className="grid grid-cols-2 gap-4 w-full">
                      <Label htmlFor={`word-${word.id}`} className="dark:text-gray-200">
                        {word.german}
                      </Label>
                      <Label htmlFor={`word-${word.id}`} className="text-gray-600 dark:text-gray-400">
                        {word.english}
                      </Label>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setShowWordSelector(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => setShowWordSelector(false)}
                disabled={selectedWordIds.length === 0}
              >
                Confirm Selection
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Start Game Button (when not in game) */}
        {!gameActive && !showResults && (
          <div className="flex justify-center mb-8">
            <Button 
              onClick={startGame} 
              size="lg" 
              className="px-8 py-6 text-lg font-medium"
              disabled={filteredWords.length === 0 || (selectionMode === "individual" && selectedWordIds.length === 0)}
            >
              <Play className="mr-2 h-5 w-5" />
              Start Game
            </Button>
          </div>
        )}
        
        {/* Flashcard Component (shown during active game) */}
        {gameActive && unmasteredWords.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold dark:text-white">
                  {direction === "german-to-english" ? "German → English" : "English → German"}
                </h2>
                <p className="text-sm text-muted-foreground dark:text-gray-400">
                  {answeredCount} cards answered - {unmasteredWords.length} words remaining
                </p>
              </div>
            </div>

            {/* Make sure currentWordIndex is valid before rendering FlashcardComponent */}
            {currentWordIndex >= 0 && unmasteredWords.length > 0 && currentWordIndex < unmasteredWords.length ? (
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
        )}
        
        {/* No Words Available Message */}
        {!gameActive && !showResults && filteredWords.length === 0 && selectionMode !== "individual" && (
          <Card className="mb-8 dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4 dark:text-gray-300">
                  No flashcards available with your current selection. 
                  Try selecting a different difficulty or source, or add more vocabulary words.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* No Words Selected Message */}
        {!gameActive && !showResults && selectionMode === "individual" && selectedWordIds.length === 0 && (
          <Card className="mb-8 dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4 dark:text-gray-300">
                  Please select individual words to start the game.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Game Complete Message - shown when all words are mastered but game is still active */}
        {gameActive && unmasteredWords.length === 0 && (
          <Card className="mb-8 dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2 dark:text-white">All Words Mastered!</h3>
                <p className="text-muted-foreground mb-6 dark:text-gray-300">
                  Congratulations! You've mastered all the words in this session.
                </p>
                <Button onClick={endGame} size="lg" variant="default">
                  End Game & See Results
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FlashcardGame;
