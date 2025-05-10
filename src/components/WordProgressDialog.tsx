
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { VocabularyWord } from "@/utils/vocabularyService";
import { Star, BarChart } from "lucide-react";

interface WordProgressDialogProps {
  words: VocabularyWord[];
}

const WordProgressDialog = ({ words }: WordProgressDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Filter to only include words that have been attempted
  const attemptedWords = words.filter(word => 
    (word.timesCorrect || 0) > 0 || (word.timesIncorrect || 0) > 0
  );
  
  // Calculate stats
  const totalWords = words.length;
  const attemptedCount = attemptedWords.length;
  const masteredCount = attemptedWords.filter(word => word.mastered).length;
  const progressPercentage = totalWords > 0 
    ? Math.round((masteredCount / totalWords) * 100) 
    : 0;
  
  // Sort words by mastery status and then by difficulty
  const sortedWords = [...attemptedWords].sort((a, b) => {
    // First sort by mastery (mastered words first)
    if (a.mastered && !b.mastered) return -1;
    if (!a.mastered && b.mastered) return 1;
    
    // Then sort by difficulty (easiest first)
    return a.difficulty - b.difficulty;
  });
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          <BarChart className="h-4 w-4" />
          Word Progress
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md dark:bg-gray-800 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-center text-xl dark:text-white">Word Progress</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 my-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm mb-1 dark:text-gray-300">
              <span>Mastered: {masteredCount}/{totalWords} words</span>
              <span>{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
          
          <div className="max-h-64 overflow-y-auto pr-2 space-y-2">
            {sortedWords.length > 0 ? (
              sortedWords.map(word => {
                const correctCount = word.timesCorrect || 0;
                const incorrectCount = word.timesIncorrect || 0;
                const totalAttempts = correctCount + incorrectCount;
                const correctRatio = totalAttempts > 0 
                  ? Math.round((correctCount / totalAttempts) * 100) 
                  : 0;
                
                // Get required streak for mastery
                const requiredStreak = incorrectCount > 0 ? 3 : 2;
                const currentStreak = word.correctStreak || 0;
                
                return (
                  <div 
                    key={word.id} 
                    className={`p-3 rounded-md border ${
                      word.mastered 
                        ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800" 
                        : "bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600"
                    }`}
                  >
                    <div className="flex justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium dark:text-white">{word.german}</p>
                          <span className="text-sm text-gray-500 dark:text-gray-400">→</span>
                          <p className="dark:text-gray-300">{word.english}</p>
                        </div>
                        <div className="flex items-center mt-1 gap-2">
                          {word.mastered ? (
                            <Badge variant="success">Mastered</Badge>
                          ) : (
                            <Badge variant="progress">Progress: {currentStreak}/{requiredStreak}</Badge>
                          )}
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {correctCount} correct, {incorrectCount} incorrect
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-center">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span className="text-xs font-medium">
                            {word.difficulty === 1 ? "Easy" : 
                             word.difficulty === 2 ? "Medium" : "Hard"}
                          </span>
                        </div>
                        <div className="text-sm font-medium mt-1">
                          {correctRatio}% accuracy
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden dark:bg-gray-600">
                        <div 
                          className="h-full bg-primary"
                          style={{ width: `${correctRatio}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                No word attempts recorded yet.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WordProgressDialog;
