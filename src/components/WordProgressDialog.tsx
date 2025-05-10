
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { VocabularyWord } from "@/utils/vocabularyService";
import { Star, BarChart } from "lucide-react";

interface WordProgressDialogProps {
  words: VocabularyWord[];
  gameSessionOnly?: boolean;
}

const WordProgressDialog = ({ words, gameSessionOnly = false }: WordProgressDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [cachedWords, setCachedWords] = useState<VocabularyWord[]>([]);
  
  // Get the most up-to-date word data directly from localStorage or from the current game session
  const getLatestWordData = () => {
    if (gameSessionOnly) {
      // In game session mode, use the words directly passed to the component
      return words;
    }
    
    // Otherwise, retrieve the latest word data from localStorage
    const storedVocabulary = localStorage.getItem('german_vocabulary');
    if (!storedVocabulary) return words;
    
    const allVocabulary = JSON.parse(storedVocabulary);
    
    // Create a map of word IDs from our props
    const wordIds = new Set(words.map(word => word.id));
    
    // Filter to only include the words that are in our props
    return allVocabulary.filter((word: VocabularyWord) => wordIds.has(word.id));
  };
  
  // This function will be called whenever the dialog is opened
  const handleDialogChange = (open: boolean) => {
    setIsOpen(open);
    
    // When opening the dialog, update our cached words
    if (open) {
      setCachedWords(getLatestWordData());
    }
  };
  
  // Prepare data only when the dialog is open to ensure we have the latest data
  const prepareDialogData = () => {
    // Use the cached words - this ensures we're displaying the words as they were
    // when the dialog was opened, not any later updates
    const latestWords = cachedWords.length > 0 ? cachedWords : getLatestWordData();
    
    // Calculate stats
    const totalWords = latestWords.length;
    const masteredCount = latestWords.filter(word => word.mastered).length;
    const progressPercentage = totalWords > 0 
      ? Math.round((masteredCount / totalWords) * 100) 
      : 0;
    
    // Sort words by mastery status and then by difficulty
    const sortedWords = [...latestWords].sort((a, b) => {
      // First sort by mastery (mastered words first)
      if (a.mastered && !b.mastered) return -1;
      if (!a.mastered && b.mastered) return 1;
      
      // Then sort by difficulty (easiest first)
      return a.difficulty - b.difficulty;
    });
    
    return {
      totalWords,
      masteredCount,
      progressPercentage,
      sortedWords
    };
  };
  
  // Only calculate the data if the dialog is open
  const dialogData = isOpen ? prepareDialogData() : null;
  
  // Calculate mastery requirements for a word
  const getMasteryRequirement = (word: VocabularyWord) => {
    return (word.timesIncorrect || 0) > 0 ? 3 : 2;
  };
  
  // Calculate progress percentage for a word
  const getWordProgressPercentage = (word: VocabularyWord) => {
    if (word.mastered) return 100;
    
    const requirement = getMasteryRequirement(word);
    const currentStreak = word.correctStreak || 0;
    return Math.round((currentStreak / requirement) * 100);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
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
          <DialogTitle className="text-center text-xl dark:text-white">
            {gameSessionOnly ? "Game Session Progress" : "Word Progress"}
          </DialogTitle>
        </DialogHeader>
        
        {dialogData && (
          <div className="space-y-4 my-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm mb-1 dark:text-gray-300">
                <span>Overall Progress: {dialogData.masteredCount}/{dialogData.totalWords} words</span>
                <span>{dialogData.progressPercentage}%</span>
              </div>
              <Progress 
                value={dialogData.progressPercentage} 
                className="h-2" 
                indicatorClassName="bg-green-500 dark:bg-green-500"
              />
            </div>
            
            <div className="max-h-64 overflow-y-auto pr-2 space-y-2">
              {dialogData.sortedWords.length > 0 ? (
                dialogData.sortedWords.map(word => {
                  const correctCount = word.timesCorrect || 0;
                  const incorrectCount = word.timesIncorrect || 0;
                  const totalAttempts = correctCount + incorrectCount;
                  
                  // Get required streak for mastery
                  const requiredStreak = getMasteryRequirement(word);
                  const currentStreak = word.correctStreak || 0;
                  const progressPercentage = getWordProgressPercentage(word);
                  
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
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Mastery Progress</span>
                          <span>{progressPercentage}%</span>
                        </div>
                        <Progress 
                          value={progressPercentage} 
                          className="h-1.5" 
                          indicatorClassName={word.mastered ? "bg-green-500 dark:bg-green-500" : "bg-green-500 dark:bg-green-500"}
                        />
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
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WordProgressDialog;
