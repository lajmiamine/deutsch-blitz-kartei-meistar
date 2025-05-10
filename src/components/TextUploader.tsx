
import React, { useState, useCallback, ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { addMultipleVocabularyWords } from "@/utils/vocabularyService";
import { XCircle, Upload, Info } from "lucide-react";
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

interface TextUploaderProps {
  onFileImported?: () => void;
  onWordsExtracted?: (words: Array<{ german: string; english: string; }>, source?: string) => void;
}

// Define the import status type as a union type to ensure proper comparison
type ImportStatus = "extracted" | "imported" | "ready" | "none" | "processing";

const TextUploader: React.FC<TextUploaderProps> = ({ onFileImported, onWordsExtracted }) => {
  const { toast } = useToast();
  const [text, setText] = useState<string>("");
  const [extractedWords, setExtractedWords] = useState<Array<{ german: string; english: string; difficulty?: number }>>([]);
  const [importStatus, setImportStatus] = useState<ImportStatus>("none");
  const [isProcessing, setIsProcessing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number>(1);
  const [duplicateCount, setDuplicateCount] = useState<number>(0);
  
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
          const wordsWithDifficulty = parsedWords.map(word => ({
            ...word,
            difficulty: selectedDifficulty
          }));
          
          // Check for duplicates
          let duplicates = 0;
          wordsWithDifficulty.forEach(word => {
            if (getExistingWordByGerman(word.german)) {
              duplicates++;
            }
          });
          setDuplicateCount(duplicates);
          
          setExtractedWords(wordsWithDifficulty);
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
      const newWords: Array<{ german: string; english: string; difficulty?: number }> = [];
      let duplicates = 0;
      
      lines.forEach(line => {
        const parts = line.split('-').map(part => part.trim());
        if (parts.length === 2) {
          const [german, english] = parts;
          // Check if this is a duplicate
          if (getExistingWordByGerman(german)) {
            duplicates++;
          }
          newWords.push({ 
            german, 
            english, 
            difficulty: selectedDifficulty 
          });
        }
      });
      
      setDuplicateCount(duplicates);
      setExtractedWords(newWords);
      setImportStatus("extracted");
      setIsProcessing(false);
      
      // Call the onWordsExtracted prop if provided
      if (onWordsExtracted && newWords.length > 0) {
        onWordsExtracted(newWords, "Text Input");
      }
    }
  }, [text, toast, onWordsExtracted, file, selectedDifficulty]);
  
  const handleImport = async () => {
    if (extractedWords.length === 0) {
      toast({
        title: "No Words to Import",
        description: "Please extract words first.",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    setImportStatus("processing");
    
    // Use the filename as source for file imports, or "Text Input" for text
    const source = file ? file.name.replace(/\.[^/.]+$/, "") : "Text Input";
    const { added, skipped } = addMultipleVocabularyWords(extractedWords, source);
    
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
  };
  
  const handleClear = () => {
    setText("");
    setExtractedWords([]);
    setImportStatus("none");
    setFile(null);
    setDuplicateCount(0);
  };
  
  const handleRemoveWord = (index: number) => {
    const updatedWords = [...extractedWords];
    updatedWords.splice(index, 1);
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

  // Get the number of words that will be imported (total - duplicates)
  const wordsToImport = extractedWords.length - duplicateCount;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Import Vocabulary from Text</CardTitle>
        <CardDescription>
          Paste text or upload a file with German words and their English translations.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="fileUpload">Upload File (Optional)</Label>
          <div className="flex items-center gap-2">
            <Input
              id="fileUpload"
              type="file"
              onChange={handleFileChange}
              accept=".txt,.doc,.docx,.pdf"
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
            </p>
          )}
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="vocabulary">Or Paste Vocabulary Text</Label>
          <Textarea
            id="vocabulary"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="German - English"
            className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
            disabled={!!file}
          />
          {file && (
            <p className="text-sm text-muted-foreground">
              Text input is disabled when a file is selected.
            </p>
          )}
        </div>
        
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
                  To import: {wordsToImport}
                </Badge>
              </div>
            </div>
            <ul className="list-none pl-0 border rounded-md divide-y max-h-60 overflow-y-auto">
              {extractedWords.map((word, index) => {
                const isExisting = getExistingWordByGerman(word.german);
                return (
                  <li 
                    key={index} 
                    className={`flex items-center justify-between py-2 px-3 ${
                      isExisting ? 'bg-red-50 dark:bg-red-900/20' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isExisting && (
                        <Info className="h-4 w-4 text-red-500" />
                      )}
                      <span className={isExisting ? 'text-red-500' : ''}>
                        {word.german} - {word.english}
                      </span>
                      {isExisting && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Duplicate
                        </Badge>
                      )}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      onClick={() => handleRemoveWord(index)}
                    >
                      <XCircle className="h-4 w-4" />
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
            disabled={isProcessing || wordsToImport === 0}
            className="dark:bg-primary dark:text-primary-foreground"
          >
            {isProcessing ? "Importing..." : `Import ${wordsToImport} Words`}
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
