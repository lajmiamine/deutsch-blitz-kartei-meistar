
import { Card } from "@/components/ui/card";
import { VocabularyWord } from "@/utils/vocabularyService";
import { Check, X } from "lucide-react";

interface PreviousFlashcardDisplayProps {
  word: VocabularyWord | null;
  wasCorrect: boolean | null;
  userAnswer: string;
  direction: "german-to-english" | "english-to-german";
}

const PreviousFlashcardDisplay = ({ 
  word, 
  wasCorrect, 
  userAnswer,
  direction 
}: PreviousFlashcardDisplayProps) => {
  // If no previous word, don't render anything
  if (!word) return null;

  const promptWord = direction === "german-to-english" ? word.german : word.english;
  const correctAnswer = direction === "german-to-english" ? word.english : word.german;

  return (
    <Card className={`border p-4 mb-4 shadow-sm ${
      wasCorrect ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800" : 
      wasCorrect === false ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800" : 
      "bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700"
    }`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Previous Word</h5>
            {wasCorrect !== null && (
              wasCorrect ? 
              <Check className="h-4 w-4 text-green-500" /> : 
              <X className="h-4 w-4 text-red-500" />
            )}
          </div>
          <p className="mt-1 text-base font-medium">{promptWord}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {direction === "german-to-english" ? "English" : "German"}
          </p>
          <p className="mt-1 text-sm font-medium">{correctAnswer}</p>
        </div>
      </div>

      {wasCorrect === false && (
        <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">Your answer:</p>
          <p className="text-sm">{userAnswer || "(empty)"}</p>
        </div>
      )}
    </Card>
  );
};

export default PreviousFlashcardDisplay;
