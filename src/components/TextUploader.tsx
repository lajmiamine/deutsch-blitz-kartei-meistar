
import React, { useState, useCallback, ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { addMultipleVocabularyWords } from "@/utils/vocabularyService";
import { XCircle, Upload } from "lucide-react";
import { extractVocabularyFromText } from "@/utils/textParser";

interface TextUploaderProps {
  onFileImported?: () => void;
  onWordsExtracted?: (words: Array<{ german: string; english: string; }>, source?: string) => void;
}

// Define the import status type as a union type to ensure proper comparison
type ImportStatus = "extracted" | "imported" | "ready" | "none" | "processing";

const TextUploader: React.FC<TextUploaderProps> = ({ onFileImported, onWordsExtracted }) => {
  const { toast } = useToast();
  const [text, setText] = useState<string>("");
  const [source, setSource] = useState<string>("");
  const [extractedWords, setExtractedWords] = useState<Array<{ german: string; english: string; difficulty?: number }>>([]);
  const [importStatus, setImportStatus] = useState<ImportStatus>("none");
  const [isProcessing, setIsProcessing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
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
          setExtractedWords(parsedWords);
          setImportStatus("extracted");
          
          // Call the onWordsExtracted prop if provided
          if (onWordsExtracted && parsedWords.length > 0) {
            onWordsExtracted(parsedWords, source);
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
      
      lines.forEach(line => {
        const parts = line.split('-').map(part => part.trim());
        if (parts.length === 2) {
          const [german, english] = parts;
          newWords.push({ german, english });
        }
      });
      
      setExtractedWords(newWords);
      setImportStatus("extracted");
      setIsProcessing(false);
      
      // Call the onWordsExtracted prop if provided
      if (onWordsExtracted && newWords.length > 0) {
        onWordsExtracted(newWords, source);
      }
    }
  }, [text, toast, source, onWordsExtracted, file]);
  
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
    setSource("");
    setExtractedWords([]);
    setImportStatus("none");
    setFile(null);
  };
  
  const handleClear = () => {
    setText("");
    setSource("");
    setExtractedWords([]);
    setImportStatus("none");
    setFile(null);
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
      // If source is empty, use filename as source
      if (!source) {
        setSource(selectedFile.name.replace(/\.[^/.]+$/, "")); // Remove extension
      }
    }
  };

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
          <Label htmlFor="source">Source (Optional)</Label>
          <Input
            id="source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="e.g., 'My Textbook Chapter 1'"
            className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
          />
        </div>
        
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
        
        {extractedWords.length > 0 && (
          <div className="grid gap-2">
            <Label>Extracted Words</Label>
            <ul className="list-none pl-0">
              {extractedWords.map((word, index) => (
                <li key={index} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span>{word.german} - {word.english}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    onClick={() => handleRemoveWord(index)}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </li>
              ))}
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
            disabled={isProcessing}
            className="dark:bg-primary dark:text-primary-foreground"
          >
            {isProcessing ? "Importing..." : "Import Vocabulary"}
          </Button>
        ) : (
          <Button 
            onClick={extractVocabulary} 
            disabled={isProcessing}
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
