import { useState, useEffect, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { VocabularyWord } from "@/utils/vocabularyService";
import { Trash2, Star } from "lucide-react";

interface FlashcardComponentProps {
  word: VocabularyWord | undefined;  // Make word potentially undefined to handle edge cases
  onCorrect: (wordId: string) => void;
  onIncorrect: (wordId: string) => void;
  onSkip: () => void;
  onRemove?: (wordId: string) => void;
  direction: "german-to-english" | "english-to-german";
}

const FlashcardComponent = ({ 
  word, 
  onCorrect, 
  onIncorrect, 
  onSkip,
  onRemove,
  direction
}: FlashcardComponentProps) => {
  const [userAnswer, setUserAnswer] = useState("");
  const [isFlipped, setIsFlipped] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [hint, setHint] = useState("");
  const [showExplanation, setShowExplanation] = useState(false);
  
  // Guard against undefined word object
  if (!word) {
    return (
      <Card className="border-2 p-6 shadow-lg dark:bg-gray-800 dark:border-gray-700">
        <div className="flex flex-col items-center space-y-6">
          <p className="text-lg font-medium dark:text-white">Loading flashcard...</p>
          <Button onClick={onSkip}>Next Card</Button>
        </div>
      </Card>
    );
  }

  // Determine which word to show based on direction
  const promptWord = direction === "german-to-english" ? word.german : word.english;
  const correctAnswer = direction === "german-to-english" ? word.english : word.german;

  useEffect(() => {
    // Reset states when word changes
    setUserAnswer("");
    setIsFlipped(false);
    setFeedback(null);
    setHint("");
    setShowExplanation(false);
  }, [word, direction]);

  // Calculate mastery requirement and progress
  const getMasteryRequirement = () => {
    return (word.timesIncorrect || 0) > 0 ? 3 : 2;
  };
  
  const getProgressPercentage = () => {
    if (word.mastered) return 100;
    
    const requirement = getMasteryRequirement();
    const currentStreak = word.correctStreak || 0;
    return Math.round((currentStreak / requirement) * 100);
  };

  const checkAnswer = () => {
    const normalizedUserAnswer = userAnswer.trim().toLowerCase();
    const normalizedCorrectAnswer = correctAnswer.trim().toLowerCase();
    
    const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
    
    if (isCorrect) {
      setFeedback("correct");
      onCorrect(word.id);
    } else {
      setFeedback("incorrect");
      onIncorrect(word.id);
      setShowExplanation(true); // Only show explanation for incorrect answers
    }
    
    setIsFlipped(true);
  };

  const handleSkip = () => {
    setIsFlipped(true);
    onSkip();
  };
  
  const provideHint = () => {
    const words = correctAnswer.split(" ");
    let newHint = "";
    
    if (words.length > 1) {
      // For multi-word answers, show the first letter of each word
      newHint = words.map(w => w[0] + "...").join(" ");
    } else {
      // For single words, show the first letter and length
      newHint = correctAnswer[0] + "..." + ` (${correctAnswer.length} letters)`;
    }
    
    setHint(newHint);
  };

  // Fix: Safely handle the optional onRemove prop
  const handleRemoveWord = () => {
    if (onRemove && confirm(`Are you sure you want to remove "${word.german}" from your vocabulary?`)) {
      onRemove(word.id);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (isFlipped) {
        // If card is already flipped, go to next word
        onSkip();
      } else {
        // Otherwise check the answer
        checkAnswer();
      }
    }
  };

  // Get difficulty label and color
  const getDifficultyInfo = () => {
    switch(word.difficulty) {
      case 1:
        return { label: "Easy", color: "text-green-500" };
      case 2:
        return { label: "Medium", color: "text-yellow-500" };
      case 3:
        return { label: "Hard", color: "text-red-500" };
      default:
        return { label: "Unknown", color: "text-gray-500" };
    }
  };
  
  // Get mastery status badge
  const getMasteryBadge = () => {
    const requiredCorrect = getMasteryRequirement();
    const currentStreak = word.correctStreak || 0;
    
    if (word.mastered) {
      return <Badge variant="success" className="ml-2">Mastered</Badge>;
    } else if (currentStreak > 0) {
      return <Badge variant="progress" className="ml-2">{currentStreak}/{requiredCorrect}</Badge>;
    }
    return null;
  };
  
  const difficultyInfo = getDifficultyInfo();

  // Show source if available
  const sourceDisplay = word.source ? (
    <div className="text-xs text-muted-foreground dark:text-gray-400 mt-1">
      Source: {word.source}
    </div>
  ) : null;

  // Simplified word progress display with progress bar
  const wordProgressDisplay = (
    <div className="mt-3 space-y-1">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground dark:text-gray-400">
          Mastery Progress: {word.correctStreak || 0}/{getMasteryRequirement()}
        </span>
        <span className="font-medium">{getProgressPercentage()}%</span>
      </div>
      <Progress 
        value={getProgressPercentage()} 
        className="h-1.5" 
        indicatorClassName={
          word.mastered 
            ? "bg-green-500 dark:bg-green-500" 
            : "bg-green-500 dark:bg-green-500"
        }
      />
    </div>
  );

  return (
    <div className={`flashcard w-full max-w-md mx-auto ${isFlipped ? "flipped" : ""}`}>
      <div className="flashcard-inner">
        <Card className="flashcard-front border-2 p-6 shadow-lg dark:bg-gray-800 dark:border-gray-700">
          <div className="flex flex-col items-center space-y-6">
            <div className="flex justify-between w-full">
              <div className="space-y-2 text-center flex-1">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <h3 className="text-2xl font-bold text-german-black dark:text-white">
                    {promptWord}
                  </h3>
                  <span className={`text-xs font-medium ${difficultyInfo.color} flex items-center gap-1`}>
                    <Star className="h-3 w-3" /> {difficultyInfo.label}
                  </span>
                  {getMasteryBadge()}
                </div>
                <p className="text-sm text-muted-foreground dark:text-gray-400">
                  {direction === "german-to-english" ? "Translate to English" : "Translate to German"}
                </p>
                {sourceDisplay}
                
                {/* Add the simplified progress display here */}
                {wordProgressDisplay}
                
                {hint && (
                  <p className="text-sm text-muted-foreground dark:text-gray-400">Hint: {hint}</p>
                )}
              </div>
              {onRemove && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" 
                  onClick={handleRemoveWord}
                  title="Remove this word from your vocabulary"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <div className="w-full space-y-4">
              <Input
                placeholder={`Type the ${direction === "german-to-english" ? "English" : "German"} translation...`}
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
              
              <div className="flex space-x-2 justify-center">
                <Button 
                  onClick={checkAnswer}
                  className="dark:bg-primary dark:text-primary-foreground"
                >
                  Check
                </Button>
                <Button 
                  variant="outline" 
                  onClick={provideHint}
                  className="dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  Hint
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={handleSkip}
                  className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                >
                  Skip
                </Button>
              </div>
            </div>
          </div>
        </Card>
        
        <Card 
          className={`flashcard-back border-2 p-6 shadow-lg ${
            feedback === "correct" ? "bg-green-50 border-green-500 dark:bg-green-900/30 dark:border-green-600" : 
            feedback === "incorrect" ? "bg-red-50 border-red-500 dark:bg-red-900/30 dark:border-red-600" : 
            "dark:bg-gray-800 dark:border-gray-700"
          }`}
        >
          <div className="flex flex-col items-center space-y-6">
            <div className="w-full flex justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground dark:text-gray-400">
                    {direction === "german-to-english" ? "The German word" : "The English word"}
                  </p>
                  <span className={`text-xs font-medium ${difficultyInfo.color} flex items-center gap-1`}>
                    <Star className="h-3 w-3" /> {difficultyInfo.label}
                  </span>
                  {getMasteryBadge()}
                </div>
                <h3 className="text-2xl font-bold dark:text-white">{promptWord}</h3>
                {sourceDisplay}
              </div>
              {onRemove && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" 
                  onClick={handleRemoveWord}
                  title="Remove this word from your vocabulary"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {/* Show translation for both correct and incorrect answers */}
            <div className="space-y-1 text-center">
              <p className="text-sm text-muted-foreground dark:text-gray-400">Translates to</p>
              <h3 className="text-2xl font-bold dark:text-white">{correctAnswer}</h3>
            </div>
            
            {feedback && (
              <div className={`text-center ${
                feedback === "correct" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              }`}>
                <p className="font-medium text-lg">
                  {feedback === "correct" ? "Correct!" : "Incorrect!"}
                </p>
                {/* Show user's answer for incorrect answers */}
                {showExplanation && feedback === "incorrect" && (
                  <div className="mt-2">
                    <p className="text-sm">
                      Your answer: {userAnswer || "(empty)"}
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* Simplified word progress display with progress bar */}
            <div className="w-full">
              {wordProgressDisplay}
            </div>
            
            <Button 
              onClick={onSkip}
              className="dark:bg-primary dark:text-primary-foreground"
            >
              Next Word
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FlashcardComponent;
