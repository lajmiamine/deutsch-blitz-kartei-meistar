
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { VocabularyWord } from "@/utils/vocabularyService";

interface FlashcardComponentProps {
  word: VocabularyWord;
  onCorrect: () => void;
  onIncorrect: () => void;
  onSkip: () => void;
}

const FlashcardComponent = ({ word, onCorrect, onIncorrect, onSkip }: FlashcardComponentProps) => {
  const [userAnswer, setUserAnswer] = useState("");
  const [isFlipped, setIsFlipped] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [hint, setHint] = useState("");

  useEffect(() => {
    // Reset states when word changes
    setUserAnswer("");
    setIsFlipped(false);
    setFeedback(null);
    setHint("");
  }, [word]);

  const checkAnswer = () => {
    const normalizedUserAnswer = userAnswer.trim().toLowerCase();
    const normalizedCorrectAnswer = word.english.trim().toLowerCase();
    
    if (normalizedUserAnswer === normalizedCorrectAnswer) {
      setFeedback("correct");
      onCorrect();
    } else {
      setFeedback("incorrect");
      onIncorrect();
    }
    
    setIsFlipped(true);
  };

  const handleSkip = () => {
    setIsFlipped(true);
    onSkip();
  };
  
  const provideHint = () => {
    const words = word.english.split(" ");
    let newHint = "";
    
    if (words.length > 1) {
      // For multi-word answers, show the first letter of each word
      newHint = words.map(w => w[0] + "...").join(" ");
    } else {
      // For single words, show the first letter and length
      newHint = word.english[0] + "..." + ` (${word.english.length} letters)`;
    }
    
    setHint(newHint);
  };

  return (
    <div className={`flashcard w-full max-w-md mx-auto ${isFlipped ? "flipped" : ""}`}>
      <div className="flashcard-inner">
        <Card className="flashcard-front border-2 p-6 shadow-lg">
          <div className="flex flex-col items-center space-y-8">
            <div className="space-y-2 text-center">
              <h3 className="text-2xl font-bold text-german-black">
                {word.german}
              </h3>
              {hint && (
                <p className="text-sm text-muted-foreground">Hint: {hint}</p>
              )}
            </div>
            
            <div className="w-full space-y-4">
              <Input
                placeholder="Type the English translation..."
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
            <div className="space-y-1 text-center">
              <p className="text-sm text-muted-foreground">The German word</p>
              <h3 className="text-2xl font-bold">{word.german}</h3>
            </div>
            
            <div className="space-y-1 text-center">
              <p className="text-sm text-muted-foreground">Translates to</p>
              <h3 className="text-2xl font-bold">{word.english}</h3>
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
            
            <Button onClick={onCorrect}>Next Word</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FlashcardComponent;
