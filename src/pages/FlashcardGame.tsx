
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import FlashcardComponent from "@/components/FlashcardComponent";
import Navbar from "@/components/Navbar";
import { 
  VocabularyWord, 
  getApprovedVocabulary,
  updateWordStatistics,
  getVocabularyByDifficulty
} from "@/utils/vocabularyService";
import { useToast } from "@/components/ui/use-toast";

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
  }, [difficulty, toast]);

  // Initialize game
  useEffect(() => {
    loadWords();
  }, [loadWords]);

  // Check if we've run out of words
  useEffect(() => {
    if (gameStarted && words.length > 0 && currentWordIndex >= words.length) {
      toast({
        title: "Game Complete!",
        description: `Your final score: ${score}/${totalAttempts}`,
        duration: 5000,
      });
      setGameStarted(false);
    }
  }, [currentWordIndex, words.length, gameStarted, score, totalAttempts, toast]);

  const startGame = () => {
    loadWords();
    setScore(0);
    setStreak(0);
    setTotalAttempts(0);
    setCurrentWordIndex(0);
    setGameStarted(true);
  };

  const handleCorrectAnswer = () => {
    if (currentWordIndex < words.length) {
      updateWordStatistics(words[currentWordIndex].id, true);
      setScore(prev => prev + 1);
      setStreak(prev => prev + 1);
      setBestStreak(prev => Math.max(prev, streak + 1));
      setTotalAttempts(prev => prev + 1);
      setCurrentWordIndex(prev => prev + 1);
      
      toast({
        title: "Correct!",
        description: `Streak: ${streak + 1}`,
        duration: 1000,
      });
    }
  };

  const handleIncorrectAnswer = () => {
    if (currentWordIndex < words.length) {
      updateWordStatistics(words[currentWordIndex].id, false);
      setStreak(0);
      setTotalAttempts(prev => prev + 1);
      setCurrentWordIndex(prev => prev + 1);
      
      toast({
        title: "Incorrect!",
        variant: "destructive",
        duration: 1000,
      });
    }
  };

  const handleSkip = () => {
    if (currentWordIndex < words.length) {
      setStreak(0);
      setCurrentWordIndex(prev => prev + 1);
    }
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
                    <span>Progress</span>
                    <span>{currentWordIndex}/{words.length}</span>
                  </div>
                  <Progress value={(currentWordIndex / words.length) * 100} className="h-2" />
                </div>
                
                <div className="flex justify-center space-x-2 mb-4">
                  <Badge variant="outline" className="bg-german-black text-white">
                    {difficulty === "all" ? "All Levels" : 
                     difficulty === "easy" ? "Easy" : 
                     difficulty === "medium" ? "Medium" : "Hard"}
                  </Badge>
                  <Badge variant="outline" className="bg-german-gold text-black">
                    {direction === "german-to-english" ? "German → English" : "English → German"}
                  </Badge>
                </div>
                
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={toggleDirection}>
                    {direction === "german-to-english" 
                      ? "Switch to English → German" 
                      : "Switch to German → English"}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {words.length > 0 && currentWordIndex < words.length ? (
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
