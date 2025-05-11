import React, { useState, useCallback, ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { addMultipleVocabularyWords } from "@/utils/vocabularyService";
import { XCircle, Upload, Info, Edit, Check, Trash2, FileJson, FileXml } from "lucide-react";
import { extractVocabularyFromText } from "@/utils/textParser";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { getExistingWordByGerman } from "@/utils/vocabularyService";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

interface TextUploaderProps {
  onFileImported?: () => void;
  onWordsExtracted?: (words: Array<{ german: string; english: string; }>, source?: string) => void;
}

// Define the import status type as a union type to ensure proper comparison
type ImportStatus = "extracted" | "imported" | "ready" | "none" | "processing";

interface ExtractedWord {
  german: string;
  english: string;
  difficulty?: number;
  isEditing?: boolean;
  isDuplicate?: boolean;
  isSelected?: boolean;
}

const TextUploader: React.FC<TextUploaderProps> = ({ onFileImported, onWordsExtracted }) => {
  const { toast } = useToast();
  const [text, setText] = useState<string>("");
  const [extractedWords, setExtractedWords] = useState<ExtractedWord[]>([]);
  const [importStatus, setImportStatus] = useState<ImportStatus>("none");
  const [isProcessing, setIsProcessing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number>(1);
  const [duplicateCount, setDuplicateCount] = useState<number>(0);
  const [selectedWordsCount, setSelectedWordsCount] = useState<number>(0);
  
  const extractVocabulary = useCallback(() => {
    if (!text.trim() && !file) {
      toast({
        title: "No Content Provided",
        description: "Please paste text or upload a file containing vocabulary words.",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    setImportStatus("processing");
    
    if (file) {
      // Process file using the existing extractVocabularyFromText function
      extractVocabularyFromText(file, 'de', 'en')
        .then(parsedWords => {
          // Apply the selected difficulty to all words
          const wordsWithDifficulty: ExtractedWord[] = parsedWords.map(word => {
            const isDuplicate = !!getExistingWordByGerman(word.german);
            return {
              ...word,
              difficulty: selectedDifficulty,
              isDuplicate,
              isSelected: !isDuplicate // Auto-select non-duplicates
            };
          });
          
          // Count duplicates
          const duplicates = wordsWithDifficulty.filter(word => word.isDuplicate).length;
          setDuplicateCount(duplicates);
          
          // Count selected words (non-duplicates by default)
          const selected = wordsWithDifficulty.filter(word => word.isSelected).length;
          setSelectedWordsCount(selected);
          
          // Sort words to show non-duplicates first
          const sortedWords = [...wordsWithDifficulty].sort((a, b) => {
            if (a.isDuplicate === b.isDuplicate) return 0;
            return a.isDuplicate ? 1 : -1; // non-duplicates first
          });
          
          setExtractedWords(sortedWords);
          setImportStatus("extracted");
          
          // Call the onWordsExtracted prop if provided
          if (onWordsExtracted && wordsWithDifficulty.length > 0) {
            // Use filename without extension as source
            const source = file.name.replace(/\.[^/.]+$/, "");
            onWordsExtracted(wordsWithDifficulty, source);
          }
        })
        .catch(error => {
          toast({
            title: "Error Processing File",
            description: error.message || "Failed to extract vocabulary from file.",
            variant: "destructive",
          });
        })
        .finally(() => {
          setIsProcessing(false);
        });
    } else {
      // Process text input (existing functionality)
      // Basic regex to split lines and extract words
      const lines = text.split('\n').filter(line => line.trim() !== '');
      const newWords: ExtractedWord[] = [];
      
      lines.forEach(line => {
        const parts = line.split('-').map(part => part.trim());
        if (parts.length === 2) {
          const [german, english] = parts;
          const isDuplicate = !!getExistingWordByGerman(german);
          newWords.push({ 
            german, 
            english, 
            difficulty: selectedDifficulty,
            isDuplicate,
            isSelected: !isDuplicate // Auto-select non-duplicates
          });
        }
      });
      
      // Count duplicates
      const duplicates = newWords.filter(word => word.isDuplicate).length;
      setDuplicateCount(duplicates);
      
      // Count selected words (non-duplicates by default)
      const selected = newWords.filter(word => word.isSelected).length;
      setSelectedWordsCount(selected);
      
      // Sort words to show non-duplicates first
      const sortedWords = [...newWords].sort((a, b) => {
        if (a.isDuplicate === b.isDuplicate) return 0;
        return a.isDuplicate ? 1 : -1; // non-duplicates first
      });
      
      setExtractedWords(sortedWords);
      setImportStatus("extracted");
      setIsProcessing(false);
      
      // Call the onWordsExtracted prop if provided
      if (onWordsExtracted && newWords.length > 0) {
        onWordsExtracted(newWords, "Text Input");
      }
    }
  }, [text, toast, onWordsExtracted, file, selectedDifficulty]);
  
  const handleImport = async () => {
    const selectedWords = extractedWords.filter(word => word.isSelected);
    
    if (selectedWords.length === 0) {
      toast({
        title: "No Words Selected",
        description: "Please select at least one word to import.",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    setImportStatus("processing");
    
    // Use the filename as source for file imports, or "Text Input" for text
    const source = file ? file.name.replace(/\.[^/.]+$/, "") : "Text Input";
    const { added, skipped } = addMultipleVocabularyWords(selectedWords, source);
    
    setImportStatus("imported");
    setIsProcessing(false);
    
    toast({
      title: "Import Complete",
      description: `Added ${added} words, skipped ${skipped} duplicates.`,
    });
    
    // Notify parent component that words were imported
    if (onFileImported) {
      onFileImported();
    }
    
    // Reset the state
    setText("");
    setExtractedWords([]);
    setImportStatus("none");
    setFile(null);
    setSelectedWordsCount(0);
    setDuplicateCount(0);
  };
  
  const handleClear = () => {
    setText("");
    setExtractedWords([]);
    setImportStatus("none");
    setFile(null);
    setDuplicateCount(0);
    setSelectedWordsCount(0);
    setSelectedDifficulty(1);
  };
  
  const handleRemoveWord = (index: number) => {
    const updatedWords = [...extractedWords];
    const removedWord = updatedWords.splice(index, 1)[0];
    
    // Recalculate duplicate count
    const duplicates = updatedWords.filter(word => word.isDuplicate).length;
    setDuplicateCount(duplicates);
    
    // Recalculate selected count
    if (removedWord.isSelected) {
      setSelectedWordsCount(prevCount => prevCount - 1);
    }
    
    setExtractedWords(updatedWords);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleDifficultyChange = (value: string) => {
    const difficulty = parseInt(value, 10);
    setSelectedDifficulty(difficulty);
    
    // Update difficulty for all extracted words
    if (extractedWords.length > 0) {
      const updatedWords = extractedWords.map(word => ({
        ...word,
        difficulty
      }));
      setExtractedWords(updatedWords);
    }
  };
  
  const handleEditWord = (index: number) => {
    const updatedWords = [...extractedWords];
    updatedWords[index] = {
      ...updatedWords[index],
      isEditing: true
    };
    setExtractedWords(updatedWords);
  };
  
  const handleSaveEdit = (index: number, newEnglish: string) => {
    const updatedWords = [...extractedWords];
    updatedWords[index] = {
      ...updatedWords[index],
      english: newEnglish,
      isEditing: false
    };
    setExtractedWords(updatedWords);
  };
  
  const handleCancelEdit = (index: number) => {
    const updatedWords = [...extractedWords];
    updatedWords[index] = {
      ...updatedWords[index],
      isEditing: false
    };
    setExtractedWords(updatedWords);
  };
  
  const handleTranslationChange = (index: number, value: string) => {
    const updatedWords = [...extractedWords];
    updatedWords[index] = {
      ...updatedWords[index],
      english: value
    };
    setExtractedWords(updatedWords);
  };
  
  const handleToggleWordSelection = (index: number) => {
    const updatedWords = [...extractedWords];
    const currentWord = updatedWords[index];
    
    // Skip if it's a duplicate word - duplicates should not be selectable
    if (currentWord.isDuplicate) {
      return;
    }
    
    const newSelectedState = !currentWord.isSelected;
    
    updatedWords[index] = {
      ...currentWord,
      isSelected: newSelectedState
    };
    
    setExtractedWords(updatedWords);
    
    // Update selected words count
    setSelectedWordsCount(prev => 
      newSelectedState ? prev + 1 : prev - 1
    );
  };
  
  const handleSelectAll = () => {
    // Count how many non-duplicate words we have
    const nonDuplicateWords = extractedWords.filter(word => !word.isDuplicate);
    
    // Check if all non-duplicate words are already selected
    const allNonDuplicatesSelected = nonDuplicateWords.every(word => word.isSelected);
    
    // Toggle selection for non-duplicate words only
    const updatedWords = extractedWords.map(word => {
      if (word.isDuplicate) {
        return word; // Keep duplicate words as is (unselected)
      }
      return {
        ...word,
        isSelected: !allNonDuplicatesSelected
      };
    });
    
    setExtractedWords(updatedWords);
    setSelectedWordsCount(allNonDuplicatesSelected ? 0 : nonDuplicateWords.length);
  };
  
  const handleSelectAllNonDuplicates = () => {
    const updatedWords = extractedWords.map(word => {
      if (word.isDuplicate) {
        return word; // Keep duplicate words as is (unselected)
      }
      return {
        ...word,
        isSelected: true
      };
    });
    
    setExtractedWords(updatedWords);
    setSelectedWordsCount(extractedWords.filter(word => !word.isDuplicate).length);
  };

  // JSON example for tooltip
  const jsonExample = `{
  "words": [
    {
      "german": "Haus",
      "english": "house"
    },
    {
      "german": "Auto",
      "english": "car"
    }
  ]
}`;

  // XML example for tooltip
  const xmlExample = `<?xml version="1.0" encoding="UTF-8"?>
<words>
  <word>
    <jp>Haus</jp>
    <eng>house</eng>
  </word>
  <word>
    <jp>Auto</jp>
    <eng>car</eng>
  </word>
</words>`;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Import Vocabulary from Text</CardTitle>
        <CardDescription>
          {file 
            ? "Vocabulary will be extracted from your file."
            : "Paste text or upload a file with German words and their English translations."
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="fileUpload">Upload File</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-flex">
                    <FileJson className="h-4 w-4 text-blue-500 mr-1 cursor-help" />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="w-80 p-2">
                  <div>
                    <p className="font-semibold mb-1">JSON Format Example:</p>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                      {jsonExample}
                    </pre>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-flex">
                    <FileXml className="h-4 w-4 text-green-500 cursor-help" />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="w-80 p-2">
                  <div>
                    <p className="font-semibold mb-1">XML Format Example:</p>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                      {xmlExample}
                    </pre>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-2">
            <Input
              id="fileUpload"
              type="file"
              onChange={handleFileChange}
              accept=".txt,.doc,.docx,.pdf,.xml,.json"
              className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="dark:bg-gray-700 dark:hover:bg-gray-600"
              disabled={!file}
              onClick={() => setFile(null)}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
          {file && (
            <p className="text-sm text-muted-foreground">
              File selected: {file.name}
              {file.name.toLowerCase().endsWith('.xml') && (
                <span className="ml-2 text-blue-500">(XML format)</span>
              )}
              {file.name.toLowerCase().endsWith('.json') && (
                <span className="ml-2 text-blue-500">(JSON format)</span>
              )}
            </p>
          )}
        </div>
        
        {!file && (
          <div className="grid gap-2">
            <Label htmlFor="vocabulary">Or Paste Vocabulary Text</Label>
            <Textarea
              id="vocabulary"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="German - English"
              className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
          </div>
        )}
        
        <div className="grid gap-2">
          <Label htmlFor="difficulty">Difficulty Level</Label>
          <Select 
            value={selectedDifficulty.toString()} 
            onValueChange={handleDifficultyChange}
          >
            <SelectTrigger 
              id="difficulty" 
              className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
            >
              <SelectValue placeholder="Select difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Easy (1)</SelectItem>
              <SelectItem value="2">Medium (2)</SelectItem>
              <SelectItem value="3">Hard (3)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {extractedWords.length > 0 && (
          <div className="grid gap-2">
            <div className="flex justify-between items-center mb-2">
              <Label className="text-base font-medium">Extracted Words</Label>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs">
                  Total: {extractedWords.length}
                </Badge>
                {duplicateCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    Duplicates: {duplicateCount}
                  </Badge>
                )}
                <Badge variant="secondary" className="text-xs">
                  Selected: {selectedWordsCount}
                </Badge>
              </div>
            </div>
            
            <div className="flex gap-2 mb-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleSelectAll}
              >
                {extractedWords.filter(w => !w.isDuplicate).every(w => w.isSelected) 
                  ? "Deselect All" 
                  : "Select All"}
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleSelectAllNonDuplicates}
              >
                Select Non-Duplicates
              </Button>
            </div>
            
            <ul className="list-none pl-0 border rounded-md divide-y max-h-60 overflow-y-auto">
              {extractedWords.map((word, index) => {
                return (
                  <li 
                    key={index} 
                    className={`flex items-center justify-between py-2 px-3 ${
                      word.isDuplicate ? 'bg-red-50 dark:bg-red-900/20' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id={`select-word-${index}`}
                        checked={word.isSelected}
                        onCheckedChange={() => handleToggleWordSelection(index)}
                        disabled={word.isDuplicate}
                        className={`h-4 w-4 ${word.isDuplicate ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                    </div>
                    <div className="flex-grow flex items-center gap-2 ml-2">
                      {word.isDuplicate && (
                        <Info className="h-4 w-4 text-red-500 flex-shrink-0" />
                      )}
                      <div className="flex-grow">
                        <div className="font-medium">{word.german}</div>
                        {word.isEditing && !word.isDuplicate ? (
                          <div className="flex items-center gap-2 mt-1">
                            <Input
                              value={word.english}
                              onChange={(e) => handleTranslationChange(index, e.target.value)}
                              className="h-8 py-1 text-sm"
                              autoFocus
                            />
                            <Button 
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-green-500"
                              onClick={() => handleSaveEdit(index, word.english)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-gray-500"
                              onClick={() => handleCancelEdit(index)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className={word.isDuplicate ? 'text-red-500' : ''}>
                              {word.english}
                            </span>
                            {!word.isDuplicate && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                onClick={() => handleEditWord(index)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                      {word.isDuplicate && (
                        <Badge variant="outline" className="ml-2 text-xs flex-shrink-0">
                          Duplicate
                        </Badge>
                      )}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex-shrink-0"
                      onClick={() => handleRemoveWord(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          type="button" 
          variant="secondary" 
          onClick={handleClear}
          disabled={isProcessing}
          className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
        >
          Clear
        </Button>
        {importStatus === "extracted" ? (
          <Button 
            onClick={handleImport} 
            disabled={isProcessing || selectedWordsCount === 0}
            className="dark:bg-primary dark:text-primary-foreground"
          >
            {isProcessing ? "Importing..." : `Import ${selectedWordsCount} Words`}
          </Button>
        ) : (
          <Button 
            onClick={extractVocabulary} 
            disabled={isProcessing || (!text.trim() && !file)}
            className="dark:bg-primary dark:text-primary-foreground"
          >
            {isProcessing ? "Extracting..." : "Extract Vocabulary"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default TextUploader;
