
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import FlashcardComponent from "@/components/FlashcardComponent";
import { 
  VocabularyWord, 
  getApprovedVocabulary, 
  getVocabularyByDifficulty, 
  updateWordStatistics,
  getAllSources,
  getApprovedVocabularyBySource,
  getWordCountByDifficulty
} from "@/utils/vocabularyService";
import { CircleCheck, X, RefreshCw, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";

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
  
  // Track session progress
  const [correctAnswers, setCorrectAnswers] = useState<string[]>([]);
  const [incorrectAnswers, setIncorrectAnswers] = useState<string[]>([]);
  const [answeredCount, setAnsweredCount] = useState<number>(0);

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
    filterWords();
  }, [selectedDifficulty, words, selectedSource]);

  const loadWords = () => {
    let loadedWords: VocabularyWord[] = [];
    
    if (selectedSource) {
      // Get words from a specific source
      loadedWords = getApprovedVocabularyBySource(selectedSource);
    } else {
      // Get all approved vocabulary
      loadedWords = getApprovedVocabulary();
    }
    
    setWords(loadedWords);
    
    // Update word counts
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
    
    let filtered = [...words];
    
    // Apply difficulty filter
    if (selectedDifficulty !== "all") {
      const difficultyLevel = parseInt(selectedDifficulty);
      filtered = filtered.filter(word => word.difficulty === difficultyLevel);
    }
    
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
    setCurrentWordIndex(0);
  };

  const handleDifficultyChange = (value: string) => {
    setSelectedDifficulty(value);
  };

  const handleDirectionChange = (value: "german-to-english" | "english-to-german") => {
    setDirection(value);
  };

  const handleAnswerChecked = (cardId: string, wasCorrect: boolean) => {
    // Update word statistics
    updateWordStatistics(cardId, wasCorrect);
    
    // Update session progress
    setAnsweredCount(prev => prev + 1);
    
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
  };

  const handleNextCard = () => {
    if (currentWordIndex < filteredWords.length - 1) {
      setCurrentWordIndex(prevIndex => prevIndex + 1);
    } else {
      // Reset to beginning if at the end
      setCurrentWordIndex(0);
      toast({
        title: "Starting Over",
        description: "You've gone through all the cards. Starting from the beginning.",
        duration: 2000,
      });
    }
  };

  const handleReloadWords = () => {
    loadWords();
    filterWords();
    
    toast({
      title: "Words Reloaded",
      description: "All vocabulary words have been refreshed and reshuffled.",
      duration: 2000,
    });
  };
  
  const handleResetGame = () => {
    // Reset all progress tracking
    setCorrectAnswers([]);
    setIncorrectAnswers([]);
    setAnsweredCount(0);
    
    // Reset to first card and reshuffle
    setCurrentWordIndex(0);
    filterWords();
    
    toast({
      title: "Game Reset",
      description: "Your progress has been reset and cards have been reshuffled.",
      duration: 2000,
    });
  };
  
  // Calculate progress percentage
  const progressPercentage = filteredWords.length > 0 
    ? Math.round((answeredCount * 100) / filteredWords.length) 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Flashcard Game</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Source</CardTitle>
              <CardDescription>Select vocabulary source</CardDescription>
            </CardHeader>
            <CardContent>
              <Select 
                value={selectedSource} 
                onValueChange={handleSourceChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All words" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={undefined}>All words</SelectItem>
                  {sources.map(source => (
                    <SelectItem key={source} value={source}>{source}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Difficulty</CardTitle>
              <CardDescription>Filter words by difficulty</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={selectedDifficulty} 
                onValueChange={handleDifficultyChange} 
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all">All Difficulties ({filteredWords.length} words)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="easy" />
                  <Label htmlFor="easy">Easy ({wordCounts.easy} words)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="2" id="medium" />
                  <Label htmlFor="medium">Medium ({wordCounts.medium} words)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="3" id="hard" />
                  <Label htmlFor="hard">Hard ({wordCounts.hard} words)</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Direction</CardTitle>
              <CardDescription>Choose translation direction</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={direction} 
                onValueChange={handleDirectionChange} 
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="german-to-english" id="german-to-english" />
                  <Label htmlFor="german-to-english">German → English</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="english-to-german" id="english-to-german" />
                  <Label htmlFor="english-to-german">English → German</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </div>
        
        {/* Progress Tracking Section */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Completed: {answeredCount}/{filteredWords.length} words</span>
                <span>{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-1">
                    <CircleCheck className="h-4 w-4 text-green-600" />
                    <span className="text-sm">{correctAnswers.length} correct</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <X className="h-4 w-4 text-red-600" />
                    <span className="text-sm">{incorrectAnswers.length} incorrect</span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleResetGame}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Reset Game
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {filteredWords.length > 0 ? (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold">
                  {direction === "german-to-english" ? "German → English" : "English → German"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Card {currentWordIndex + 1} of {filteredWords.length}
                  {selectedSource ? ` from "${selectedSource}"` : ""}
                  {selectedDifficulty !== "all" ? ` (${
                    selectedDifficulty === "1" ? "Easy" : 
                    selectedDifficulty === "2" ? "Medium" : "Hard"
                  } words)` : ""}
                </p>
              </div>
              <Button variant="outline" onClick={handleReloadWords}>
                Reload Words
              </Button>
            </div>

            <FlashcardComponent
              word={filteredWords[currentWordIndex]}
              direction={direction}
              onCorrect={(wordId) => handleAnswerChecked(wordId, true)}
              onIncorrect={(wordId) => handleAnswerChecked(wordId, false)}
              onSkip={handleNextCard}
            />
          </div>
        ) : (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  No flashcards available with your current selection. 
                  Try selecting a different difficulty or source, or add more vocabulary words.
                </p>
                <Button onClick={handleReloadWords}>
                  Reload Words
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
