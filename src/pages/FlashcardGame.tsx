
import { useState, useEffect, useRef } from "react";
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
    shouldReloadWords.current = true; // Flag to reload words on next effect
    
    // Reset progress tracking when source changes
    setCorrectAnswers([]);
    setIncorrectAnswers([]);
    setAnsweredCount(0);
  };

  const handleDifficultyChange = (value: string) => {
    setSelectedDifficulty(value);
    
    // Reset progress tracking when difficulty changes
    setCorrectAnswers([]);
    setIncorrectAnswers([]);
    setAnsweredCount(0);
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="container py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 dark:text-white">Flashcard Game</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                  {sources.map(source => (
                    <SelectItem key={source} value={source}>{source}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

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
                onValueChange={handleDirectionChange} 
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
        
        {/* Progress Tracking Section */}
        <Card className="mb-6 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg dark:text-white">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm mb-1 dark:text-gray-300">
                <span>Completed: {answeredCount}/{filteredWords.length} words</span>
                <span>{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              
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
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleResetGame}
                  className="flex items-center gap-1 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
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
                <h2 className="text-xl font-semibold dark:text-white">
                  {direction === "german-to-english" ? "German → English" : "English → German"}
                </h2>
                <p className="text-sm text-muted-foreground dark:text-gray-400">
                  Card {currentWordIndex + 1} of {filteredWords.length}
                  {selectedSource ? ` from "${selectedSource}"` : ""}
                  {selectedDifficulty !== "all" ? ` (${
                    selectedDifficulty === "1" ? "Easy" : 
                    selectedDifficulty === "2" ? "Medium" : "Hard"
                  } words)` : ""}
                </p>
              </div>
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
      </div>
    </div>
  );
};

export default FlashcardGame;
