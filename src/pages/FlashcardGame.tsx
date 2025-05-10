
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, X, Shuffle } from "lucide-react";
import FlashcardComponent from "@/components/FlashcardComponent";
import Navbar from "@/components/Navbar";
import { 
  VocabularyWord, 
  getApprovedVocabulary,
  updateWordStatistics,
  getVocabularyByDifficulty,
  deleteVocabularyWord,
  getApprovedVocabularyBySource,
  getAllSources
} from "@/utils/vocabularyService";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";

const FlashcardGame = () => {
  const { toast } = useToast();
  const [allWords, setAllWords] = useState<VocabularyWord[]>([]);
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [difficulty, setDifficulty] = useState<"all" | "easy" | "medium" | "hard">("all");
  const [gameStarted, setGameStarted] = useState(false);
  const [direction, setDirection] = useState<"german-to-english" | "english-to-german">("german-to-english");
  
  const [wrongWords, setWrongWords] = useState<VocabularyWord[]>([]);
  const [showingWrongWords, setShowingWrongWords] = useState(false);
  const [wordCorrectCounts, setWordCorrectCounts] = useState<Record<string, number>>({});
  
  // New state for tracking if a word had mistakes
  const [wordMistakes, setWordMistakes] = useState<Record<string, boolean>>({});
  
  // New state for word count and selection mode
  const [wordCount, setWordCount] = useState<number | "all">(10);
  const [selectionMode, setSelectionMode] = useState<"random" | "select">("random");
  const [selectedWordIds, setSelectedWordIds] = useState<string[]>([]);
  const [isSelectingWords, setIsSelectingWords] = useState(false);
  
  // New state for source filtering
  const [availableSources, setAvailableSources] = useState<string[]>([]);
  const [selectedSource, setSelectedSource] = useState<string | undefined>(undefined);
  
  // Available word count options
  const wordCountOptions = [5, 10, 15, 20, 30, 50, "all"];

  // Load words based on selected difficulty and source
  const loadWords = useCallback(() => {
    let vocabularyWords: VocabularyWord[] = [];
    
    // First check if we're filtering by source
    if (selectedSource) {
      vocabularyWords = getApprovedVocabularyBySource(selectedSource);
    } else {
      // If no source filter, apply difficulty filter
      switch (difficulty) {
        case "easy":
          vocabularyWords = getVocabularyByDifficulty(1);
          break;
        case "medium":
          vocabularyWords = getVocabularyByDifficulty(2);
          break;
        case "hard":
          vocabularyWords = getVocabularyByDifficulty(3);
          break;
        default:
          vocabularyWords = getApprovedVocabulary();
      }
    }
    
    if (vocabularyWords.length === 0) {
      // Fall back to all words if the selected filters have no words
      vocabularyWords = getApprovedVocabulary();
      toast({
        title: "No words found for selected filters",
        description: "Showing all approved words instead.",
        duration: 3000,
      });
    }
    
    // Store all words for selection mode
    setAllWords([...vocabularyWords]);
    
    // Shuffle the words in both cases
    const shuffled = [...vocabularyWords].sort(() => Math.random() - 0.5);
    
    // Reset wrong words and correct counts
    setWrongWords([]);
    setWordCorrectCounts({});
    setWordMistakes({});
    setShowingWrongWords(false);
  }, [difficulty, selectedSource, toast]);

  // Initialize game and load sources
  useEffect(() => {
    // Load available sources
    const sources = getAllSources();
    setAvailableSources(sources);
    
    // Check if there's a source in localStorage (from the admin panel)
    const savedSource = localStorage.getItem("flashcard_source");
    if (savedSource) {
      setSelectedSource(savedSource);
      // Clear it after loading
      localStorage.removeItem("flashcard_source");
    }
    
    loadWords();
  }, [loadWords]);
  
  // Reload words when source or difficulty changes
  useEffect(() => {
    loadWords();
  }, [selectedSource, difficulty, loadWords]);

  // Prepare words for practice based on selection mode and word count
  const prepareWordsForPractice = () => {
    let practiceWords: VocabularyWord[] = [];
    
    if (selectionMode === "random") {
      // Get randomly selected words based on word count
      const shuffled = [...allWords].sort(() => Math.random() - 0.5);
      
      if (wordCount === "all") {
        practiceWords = shuffled;
      } else {
        // If we have fewer words than requested, use all available words
        const count = Math.min(wordCount as number, shuffled.length);
        practiceWords = shuffled.slice(0, count);
      }
    } else {
      // Get specifically selected words
      if (selectedWordIds.length === 0) {
        toast({
          title: "No words selected",
          description: "Please select at least one word to practice.",
          duration: 3000,
        });
        return false;
      }
      
      practiceWords = allWords
        .filter(word => selectedWordIds.includes(word.id))
        .sort(() => Math.random() - 0.5); // Always shuffle
    }
    
    if (practiceWords.length === 0) {
      toast({
        title: "No words available",
        description: "Please select different settings or add more vocabulary.",
        duration: 3000,
      });
      return false;
    }
    
    setWords(practiceWords);
    setCurrentWordIndex(0);
    return true;
  };

  // Check if we've completed all words 
  // (all words have been answered correctly 2 times, or 3 times if there were mistakes)
  useEffect(() => {
    if (gameStarted && words.length > 0) {
      const allWordsCompleted = words.every(word => {
        const requiredCorrectAnswers = wordMistakes[word.id] ? 3 : 2;
        return (wordCorrectCounts[word.id] || 0) >= requiredCorrectAnswers;
      });
      
      if (allWordsCompleted) {
        toast({
          title: "Congratulations!",
          description: `You've mastered all words! Final score: ${score}/${totalAttempts}`,
          duration: 5000,
        });
        setGameStarted(false);
      }
    }
  }, [wordCorrectCounts, words, wordMistakes, gameStarted, score, totalAttempts, toast]);

  const startGame = () => {
    // First prepare the words based on selection settings
    if (!prepareWordsForPractice()) {
      return; // Don't start if word preparation failed
    }
    
    // Reset game state
    setScore(0);
    setStreak(0);
    setTotalAttempts(0);
    setGameStarted(true);
    setWrongWords([]);
    setWordCorrectCounts({});
    setWordMistakes({});
    setShowingWrongWords(false);
    setIsSelectingWords(false);
  };

  const handleCorrectAnswer = (wordId: string) => {
    const currentWord = words[currentWordIndex];
    
    // Update word statistics
    updateWordStatistics(wordId, true);
    
    // Update score and streak
    setScore(prev => prev + 1);
    setStreak(prev => prev + 1);
    setBestStreak(prev => Math.max(prev, streak + 1));
    setTotalAttempts(prev => prev + 1);
    
    // Increment correct answer count for this word
    setWordCorrectCounts(prev => {
      const newCounts = { ...prev };
      newCounts[wordId] = (newCounts[wordId] || 0) + 1;
      return newCounts;
    });
    
    // Remove from wrong words if present
    setWrongWords(prev => prev.filter(w => w.id !== wordId));
    
    // Show toast notification
    toast({
      title: "Correct!",
      description: `Streak: ${streak + 1}`,
      duration: 1000,
    });
    
    // Check if this word is now mastered
    const requiredCorrectAnswers = wordMistakes[wordId] ? 3 : 2;
    const newCorrectCount = (wordCorrectCounts[wordId] || 0) + 1;
    
    if (newCorrectCount >= requiredCorrectAnswers) {
      toast({
        title: "Word Mastered!",
        description: `You've mastered "${currentWord.german}"`,
        duration: 2000,
      });
    }
    
    // Move to next word
    goToNextWord();
  };

  const handleIncorrectAnswer = (wordId: string) => {
    const currentWord = words[currentWordIndex];
    
    // Update word statistics
    updateWordStatistics(wordId, false);
    
    // Reset streak and increment attempts
    setStreak(0);
    setTotalAttempts(prev => prev + 1);
    
    // Add to wrong words if not already there
    if (!wrongWords.some(w => w.id === wordId)) {
      setWrongWords(prev => [...prev, currentWord]);
    }
    
    // Mark this word as having had mistakes (requiring 3 correct answers)
    setWordMistakes(prev => ({
      ...prev,
      [wordId]: true
    }));
    
    // Show toast notification
    toast({
      title: "Incorrect!",
      variant: "destructive",
      duration: 1000,
    });
    
    // Shuffle the words more aggressively after a wrong answer
    shuffleWords();
    
    // Move to next word
    goToNextWord();
  };

  const shuffleWords = () => {
    setWords(prev => {
      // Create a temporary array without the current word
      const currentWord = prev[currentWordIndex];
      const otherWords = prev.filter((_, i) => i !== currentWordIndex);
      
      // Shuffle the other words
      const shuffled = [...otherWords].sort(() => Math.random() - 0.5);
      
      // Reinsert the current word at a random position
      const randomPosition = Math.floor(Math.random() * (shuffled.length + 1));
      shuffled.splice(randomPosition, 0, currentWord);
      
      return shuffled;
    });
    
    // Reset current index since the array changed
    setCurrentWordIndex(0);
  };

  const handleSkip = () => {
    setStreak(0);
    goToNextWord();
  };

  // Function to determine the next word
  const goToNextWord = () => {
    // Filter out words that have been answered correctly the required number of times
    const remainingWords = words.filter(word => {
      const requiredCorrectAnswers = wordMistakes[word.id] ? 3 : 2;
      return (wordCorrectCounts[word.id] || 0) < requiredCorrectAnswers;
    });
    
    if (remainingWords.length === 0) {
      // All words have been completed
      return;
    }
    
    // Choose the next word
    let nextIndex = (currentWordIndex + 1) % words.length;
    let attempts = 0;
    
    // Skip words that have been mastered
    while (attempts < words.length) {
      const requiredCorrectAnswers = wordMistakes[words[nextIndex].id] ? 3 : 2;
      if ((wordCorrectCounts[words[nextIndex].id] || 0) < requiredCorrectAnswers) {
        break;
      }
      nextIndex = (nextIndex + 1) % words.length;
      attempts++;
    }
    
    setCurrentWordIndex(nextIndex);
  };

  const resetGame = () => {
    startGame();
    toast({
      title: "Game Reset",
      description: "All progress has been reset.",
      duration: 3000,
    });
  };

  // New function to handle word removal
  const handleRemoveWord = (wordId: string) => {
    // Remove the word from the vocabulary service
    deleteVocabularyWord(wordId);
    
    // Remove from current game lists
    setWords(prev => prev.filter(word => word.id !== wordId));
    setAllWords(prev => prev.filter(word => word.id !== wordId));
    setWrongWords(prev => prev.filter(word => word.id !== wordId));
    
    // Notify the user
    toast({
      title: "Word Removed",
      description: "The word has been removed from your vocabulary.",
      duration: 2000,
    });
    
    // If this was the last word, end the game
    if (words.length <= 1) {
      toast({
        title: "Game Over",
        description: "No more words to practice.",
        duration: 3000,
      });
      setGameStarted(false);
      return;
    }
    
    // Otherwise, go to next word
    goToNextWord();
  };

  const toggleWrongWords = () => {
    if (wrongWords.length === 0) {
      toast({
        title: "No Wrong Words",
        description: "You haven't answered any words incorrectly yet.",
        duration: 3000,
      });
      return;
    }
    
    setShowingWrongWords(!showingWrongWords);
  };

  const calculateAccuracy = () => {
    if (totalAttempts === 0) return 0;
    return (score / totalAttempts) * 100;
  };

  const toggleDirection = () => {
    setDirection(prev => 
      prev === "german-to-english" ? "english-to-german" : "german-to-english"
    );
    
    toast({
      title: "Language Direction Changed",
      description: direction === "german-to-english" 
        ? "Now translating from English to German" 
        : "Now translating from German to English",
      duration: 2000,
    });
  };

  // Toggle word selection
  const toggleSelectionMode = (mode: "random" | "select") => {
    setSelectionMode(mode);
    if (mode === "select") {
      setIsSelectingWords(true);
    } else {
      setIsSelectingWords(false);
    }
  };

  // Toggle word selection in the list
  const toggleWordSelection = (wordId: string) => {
    setSelectedWordIds(prev => {
      if (prev.includes(wordId)) {
        return prev.filter(id => id !== wordId);
      } else {
        return [...prev, wordId];
      }
    });
  };

  // Count how many words have been mastered
  const masteredWordCount = words.filter(word => {
    const requiredCorrectAnswers = wordMistakes[word.id] ? 3 : 2;
    return (wordCorrectCounts[word.id] || 0) >= requiredCorrectAnswers;
  }).length;

  // Function to handle source change
  const handleSourceChange = (source: string | undefined) => {
    setSelectedSource(source);
    setGameStarted(false); // Reset game state when changing source
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 text-center">German Flashcards</h1>
        
        {!gameStarted ? (
          isSelectingWords ? (
            <Card className="text-center">
              <CardHeader>
                <CardTitle>Select Words to Practice</CardTitle>
                <CardDescription>Choose specific words you want to practice</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between mb-4">
                  <span>{selectedWordIds.length} words selected</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsSelectingWords(false)}
                  >
                    Back to Settings
                  </Button>
                </div>
                
                <ScrollArea className="h-[400px] border rounded-md p-4">
                  <div className="space-y-2">
                    {allWords.map(word => (
                      <div 
                        key={word.id} 
                        className="flex items-center p-2 border rounded-md hover:bg-gray-100"
                      >
                        <Checkbox 
                          id={`word-${word.id}`}
                          checked={selectedWordIds.includes(word.id)}
                          onCheckedChange={() => toggleWordSelection(word.id)}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <label 
                            htmlFor={`word-${word.id}`}
                            className="flex justify-between cursor-pointer w-full"
                          >
                            <span className="font-medium">{word.german}</span>
                            <span className="text-muted-foreground">{word.english}</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter className="justify-between">
                <Button variant="outline" onClick={() => setIsSelectingWords(false)}>Cancel</Button>
                <Button 
                  onClick={startGame}
                  disabled={selectedWordIds.length === 0}
                  className="bg-german-gold text-black hover:bg-yellow-500"
                >
                  Start with {selectedWordIds.length} Words
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card className="text-center">
              <CardHeader>
                <CardTitle>Ready to Practice German?</CardTitle>
                <CardDescription>Select your options and start the game to improve your vocabulary</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <label className="text-sm font-medium mb-1 block">Text File Source</label>
                  <Select 
                    value={selectedSource || "all-sources"}
                    onValueChange={(value) => handleSourceChange(value === "all-sources" ? undefined : value)}
                  >
                    <SelectTrigger className="w-[250px] mx-auto">
                      <SelectValue placeholder="All sources" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-sources">All sources</SelectItem>
                      {availableSources.map((source) => (
                        <SelectItem key={source} value={source}>
                          {source}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedSource && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Showing words from "{selectedSource}"
                    </p>
                  )}
                </div>
                
                <Tabs defaultValue="all" className="w-[400px] mx-auto">
                  <TabsList className="grid grid-cols-4 mb-4">
                    <TabsTrigger value="all" onClick={() => setDifficulty("all")}>All</TabsTrigger>
                    <TabsTrigger value="easy" onClick={() => setDifficulty("easy")}>Easy</TabsTrigger>
                    <TabsTrigger value="medium" onClick={() => setDifficulty("medium")}>Medium</TabsTrigger>
                    <TabsTrigger value="hard" onClick={() => setDifficulty("hard")}>Hard</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="all" className="text-center py-4">
                    Practice with all available vocabulary words
                  </TabsContent>
                  <TabsContent value="easy" className="text-center py-4">
                    Practice with easier words that you've mastered
                  </TabsContent>
                  <TabsContent value="medium" className="text-center py-4">
                    Practice with words of moderate difficulty
                  </TabsContent>
                  <TabsContent value="hard" className="text-center py-4">
                    Challenge yourself with the most difficult words
                  </TabsContent>
                </Tabs>
                
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm text-muted-foreground">German → English</span>
                    <Switch 
                      checked={direction === "english-to-german"}
                      onCheckedChange={() => setDirection(prev => 
                        prev === "german-to-english" ? "english-to-german" : "german-to-english"
                      )}
                    />
                    <span className="text-sm text-muted-foreground">English → German</span>
                  </div>
                  
                  <div className="flex flex-col space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Number of Words</label>
                      <Select 
                        value={typeof wordCount === "number" ? wordCount.toString() : wordCount} 
                        onValueChange={(value) => {
                          if (value === "all") {
                            setWordCount("all");
                          } else {
                            setWordCount(parseInt(value));
                          }
                        }}
                      >
                        <SelectTrigger className="w-[180px] mx-auto">
                          <SelectValue placeholder="Select word count" />
                        </SelectTrigger>
                        <SelectContent>
                          {wordCountOptions.map((count) => (
                            <SelectItem key={count.toString()} value={count.toString()}>
                              {count === "all" ? "All Words" : `${count} Words`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-1 block">Selection Mode</label>
                      <div className="flex justify-center gap-4">
                        <Button 
                          variant={selectionMode === "random" ? "default" : "outline"}
                          onClick={() => toggleSelectionMode("random")}
                          className="flex items-center gap-2"
                        >
                          <Shuffle className="h-4 w-4" /> Random Words
                        </Button>
                        <Button 
                          variant={selectionMode === "select" ? "default" : "outline"}
                          onClick={() => toggleSelectionMode("select")}
                          className="flex items-center gap-2"
                        >
                          <CheckCircle className="h-4 w-4" /> Select Words
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center">
                {selectionMode === "select" ? (
                  <Button 
                    size="lg" 
                    className="bg-german-gold text-black hover:bg-yellow-500"
                    onClick={() => setIsSelectingWords(true)}
                  >
                    Select Words
                  </Button>
                ) : (
                  <Button 
                    size="lg" 
                    className="bg-german-gold text-black hover:bg-yellow-500"
                    onClick={startGame}
                  >
                    Start Game
                  </Button>
                )}
              </CardFooter>
            </Card>
          )
        ) : (
          <div className="space-y-8">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Score</p>
                    <p className="text-2xl font-bold">{score}/{totalAttempts}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Accuracy</p>
                    <p className="text-2xl font-bold">{calculateAccuracy().toFixed(0)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Current Streak</p>
                    <p className="text-2xl font-bold">{streak}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Best Streak</p>
                    <p className="text-2xl font-bold">{bestStreak}</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Mastered Words</span>
                    <span>{masteredWordCount}/{words.length}</span>
                  </div>
                  <Progress value={(masteredWordCount / (words.length || 1)) * 100} className="h-2" />
                </div>
                
                <div className="flex justify-center flex-wrap gap-2 mb-4">
                  {selectedSource ? (
                    <Badge variant="outline" className="bg-blue-500 text-white">
                      Source: {selectedSource}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-german-black text-white">
                      {difficulty === "all" ? "All Levels" : 
                      difficulty === "easy" ? "Easy" : 
                      difficulty === "medium" ? "Medium" : "Hard"}
                    </Badge>
                  )}
                  <Badge variant="outline" className="bg-german-gold text-black">
                    {direction === "german-to-english" ? "German → English" : "English → German"}
                  </Badge>
                  {wrongWords.length > 0 && (
                    <Badge variant="outline" className="bg-red-500 text-white">
                      {wrongWords.length} Wrong Words
                    </Badge>
                  )}
                  <Badge variant="outline" className="bg-blue-500 text-white">
                    {words.length} Words
                  </Badge>
                </div>
                
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={toggleDirection}>
                    {direction === "german-to-english" 
                      ? "Switch to English → German" 
                      : "Switch to German → English"}
                  </Button>
                  <Button 
                    variant={showingWrongWords ? "destructive" : "outline"} 
                    size="sm" 
                    onClick={toggleWrongWords}
                    disabled={wrongWords.length === 0}
                  >
                    {showingWrongWords ? "Hide Wrong Words" : "Show Wrong Words"}
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm" 
                    onClick={resetGame}
                  >
                    Reset Game
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {showingWrongWords ? (
              <Card className="p-4">
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Wrong Words</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setShowingWrongWords(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription>Words you've answered incorrectly</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <ScrollArea className="h-60">
                    <div className="space-y-2">
                      {wrongWords.map((word) => (
                        <div 
                          key={word.id} 
                          className="p-3 border rounded-md flex justify-between items-center"
                        >
                          <div>
                            <p className="font-medium">{word.german}</p>
                            <p className="text-sm text-muted-foreground">{word.english}</p>
                          </div>
                          <Badge className="bg-amber-500">
                            {(wordCorrectCounts[word.id] || 0)}/3 Correct
                          </Badge>
                        </div>
                      ))}
                      {wrongWords.length === 0 && (
                        <p className="text-center text-muted-foreground py-4">
                          No wrong words yet. Keep practicing!
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
                <CardFooter className="flex justify-center p-4">
                  <Button onClick={() => setShowingWrongWords(false)}>
                    Continue Practicing
                  </Button>
                </CardFooter>
              </Card>
            ) : words.length > 0 && currentWordIndex < words.length ? (
              <FlashcardComponent 
                word={words[currentWordIndex]} 
                onCorrect={handleCorrectAnswer} 
                onIncorrect={handleIncorrectAnswer} 
                onSkip={handleSkip}
                onRemove={handleRemoveWord}
                direction={direction}
              />
            ) : (
              <Card className="p-6 text-center">
                <p className="mb-4">You've completed all the flashcards!</p>
                <Button onClick={startGame}>Play Again</Button>
              </Card>
            )}
            
            <div className="flex justify-center">
              <Button variant="outline" onClick={startGame}>Restart Game</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashcardGame;
