
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { VocabularyWord } from "@/utils/vocabularyService";
import { Trash2 } from "lucide-react";

interface FlashcardComponentProps {
  word: VocabularyWord;
  onCorrect: (wordId: string) => void;
  onIncorrect: (wordId: string) => void;
  onSkip: () => void;
  onRemove: (wordId: string) => void;
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

  // Determine which word to show based on direction
  const promptWord = direction === "german-to-english" ? word.german : word.english;
  const correctAnswer = direction === "german-to-english" ? word.english : word.german;

  useEffect(() => {
    // Reset states when word changes
    setUserAnswer("");
    setIsFlipped(false);
    setFeedback(null);
    setHint("");
  }, [word, direction]);

  const checkAnswer = () => {
    const normalizedUserAnswer = userAnswer.trim().toLowerCase();
    const normalizedCorrectAnswer = correctAnswer.trim().toLowerCase();
    
    if (normalizedUserAnswer === normalizedCorrectAnswer) {
      setFeedback("correct");
      onCorrect(word.id);
    } else {
      setFeedback("incorrect");
      onIncorrect(word.id);
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

  const handleRemoveWord = () => {
    if (confirm(`Are you sure you want to remove "${word.german}" from your vocabulary?`)) {
      onRemove(word.id);
    }
  };

  return (
    <div className={`flashcard w-full max-w-md mx-auto ${isFlipped ? "flipped" : ""}`}>
      <div className="flashcard-inner">
        <Card className="flashcard-front border-2 p-6 shadow-lg">
          <div className="flex flex-col items-center space-y-8">
            <div className="flex justify-between w-full">
              <div className="space-y-2 text-center flex-1">
                <h3 className="text-2xl font-bold text-german-black">
                  {promptWord}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {direction === "german-to-english" ? "Translate to English" : "Translate to German"}
                </p>
                {hint && (
                  <p className="text-sm text-muted-foreground">Hint: {hint}</p>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-red-500 hover:text-red-700" 
                onClick={handleRemoveWord}
                title="Remove this word from your vocabulary"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="w-full space-y-4">
              <Input
                placeholder={`Type the ${direction === "german-to-english" ? "English" : "German"} translation...`}
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && checkAnswer()}
                autoFocus
              />
              
              <div className="flex space-x-2 justify-center">
                <Button onClick={checkAnswer}>Check</Button>
                <Button variant="outline" onClick={provideHint}>Hint</Button>
                <Button variant="secondary" onClick={handleSkip}>Skip</Button>
              </div>
            </div>
          </div>
        </Card>
        
        <Card 
          className={`flashcard-back border-2 p-6 shadow-lg ${
            feedback === "correct" ? "bg-green-50 border-green-500" : 
            feedback === "incorrect" ? "bg-red-50 border-red-500" : ""
          }`}
        >
          <div className="flex flex-col items-center space-y-6">
            <div className="w-full flex justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {direction === "german-to-english" ? "The German word" : "The English word"}
                </p>
                <h3 className="text-2xl font-bold">{promptWord}</h3>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-red-500 hover:text-red-700" 
                onClick={handleRemoveWord}
                title="Remove this word from your vocabulary"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-1 text-center">
              <p className="text-sm text-muted-foreground">Translates to</p>
              <h3 className="text-2xl font-bold">{correctAnswer}</h3>
            </div>
            
            {feedback && (
              <div className={`text-center ${
                feedback === "correct" ? "text-green-600" : "text-red-600"
              }`}>
                <p className="font-medium text-lg">
                  {feedback === "correct" ? "Correct!" : "Incorrect!"}
                </p>
                {feedback === "incorrect" && (
                  <p className="text-sm">
                    Your answer: {userAnswer || "(empty)"}
                  </p>
                )}
              </div>
            )}
            
            <Button onClick={onCorrect.bind(null, word.id)}>Next Word</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FlashcardComponent;
