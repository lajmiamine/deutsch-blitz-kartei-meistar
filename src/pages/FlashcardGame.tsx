import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { RefreshCcw, X } from "lucide-react";
import FlashcardComponent from "@/components/FlashcardComponent";
import Navbar from "@/components/Navbar";
import { 
  VocabularyWord, 
  getApprovedVocabulary,
  updateWordStatistics,
  getVocabularyByDifficulty
} from "@/utils/vocabularyService";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

const FlashcardGame = () => {
  const { toast } = useToast();
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [difficulty, setDifficulty] = useState<"all" | "easy" | "medium" | "hard">("all");
  const [gameStarted, setGameStarted] = useState(false);
  const [direction, setDirection] = useState<"german-to-english" | "english-to-german">("german-to-english");
  
  // New state for wrong words tracking
  const [wrongWords, setWrongWords] = useState<VocabularyWord[]>([]);
  const [showingWrongWords, setShowingWrongWords] = useState(false);
  const [wordCorrectCounts, setWordCorrectCounts] = useState<Record<string, number>>({});

  // Load words based on selected difficulty
  const loadWords = useCallback(() => {
    let vocabularyWords: VocabularyWord[] = [];
    
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
    
    if (vocabularyWords.length === 0) {
      // Fall back to all words if the selected difficulty has no words
      vocabularyWords = getApprovedVocabulary();
      toast({
        title: "No words found for selected difficulty",
        description: "Showing all approved words instead.",
        duration: 3000,
      });
    }
    
    // Shuffle the words
    const shuffled = [...vocabularyWords].sort(() => Math.random() - 0.5);
    setWords(shuffled);
    setCurrentWordIndex(0);
    // Reset wrong words and correct counts
    setWrongWords([]);
    setWordCorrectCounts({});
    setShowingWrongWords(false);
  }, [difficulty, toast]);

  // Initialize game
  useEffect(() => {
    loadWords();
  }, [loadWords]);

  // Check if we've completed all words (all words have been answered correctly 2 times)
  useEffect(() => {
    if (gameStarted && words.length > 0) {
      const allWordsCompleted = words.every(word => (wordCorrectCounts[word.id] || 0) >= 2);
      
      if (allWordsCompleted) {
        toast({
          title: "Congratulations!",
          description: `You've mastered all words! Final score: ${score}/${totalAttempts}`,
          duration: 5000,
        });
        setGameStarted(false);
      }
    }
  }, [wordCorrectCounts, words, gameStarted, score, totalAttempts, toast]);

  const startGame = () => {
    loadWords();
    setScore(0);
    setStreak(0);
    setTotalAttempts(0);
    setCurrentWordIndex(0);
    setGameStarted(true);
    setWrongWords([]);
    setWordCorrectCounts({});
    setShowingWrongWords(false);
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
    
    // Show toast notification
    toast({
      title: "Incorrect!",
      variant: "destructive",
      duration: 1000,
    });
    
    // Move to next word
    goToNextWord();
  };

  const handleSkip = () => {
    setStreak(0);
    goToNextWord();
  };

  // Function to determine the next word
  const goToNextWord = () => {
    // Filter out words that have been answered correctly 2 times
    const remainingWords = words.filter(word => (wordCorrectCounts[word.id] || 0) < 2);
    
    if (remainingWords.length === 0) {
      // All words have been completed
      return;
    }
    
    // Choose the next word
    let nextIndex = (currentWordIndex + 1) % words.length;
    let attempts = 0;
    
    // Skip words that have been answered correctly 2 times
    while ((wordCorrectCounts[words[nextIndex].id] || 0) >= 2 && attempts < words.length) {
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

  // Count how many words have been mastered (answered correctly 2 times)
  const masteredWordCount = words.filter(word => (wordCorrectCounts[word.id] || 0) >= 2).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 text-center">German Flashcards</h1>
        
        {!gameStarted ? (
          <Card className="text-center">
            <CardHeader>
              <CardTitle>Ready to Practice German?</CardTitle>
              <CardDescription>Select difficulty and start the game to improve your vocabulary</CardDescription>
            </CardHeader>
            <CardContent>
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
              
              <div className="mt-6 flex items-center justify-center gap-2">
                <span className="text-sm text-muted-foreground">German → English</span>
                <Switch 
                  checked={direction === "english-to-german"}
                  onCheckedChange={() => setDirection(prev => 
                    prev === "german-to-english" ? "english-to-german" : "german-to-english"
                  )}
                />
                <span className="text-sm text-muted-foreground">English → German</span>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button 
                size="lg" 
                className="bg-german-gold text-black hover:bg-yellow-500"
                onClick={startGame}
              >
                Start Game
              </Button>
            </CardFooter>
          </Card>
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
                  <Badge variant="outline" className="bg-german-black text-white">
                    {difficulty === "all" ? "All Levels" : 
                     difficulty === "easy" ? "Easy" : 
                     difficulty === "medium" ? "Medium" : "Hard"}
                  </Badge>
                  <Badge variant="outline" className="bg-german-gold text-black">
                    {direction === "german-to-english" ? "German → English" : "English → German"}
                  </Badge>
                  {wrongWords.length > 0 && (
                    <Badge variant="outline" className="bg-red-500 text-white">
                      {wrongWords.length} Wrong Words
                    </Badge>
                  )}
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
                    <RefreshCcw className="mr-1 h-4 w-4" /> Reset Game
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
                            {(wordCorrectCounts[word.id] || 0)}/2 Correct
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
