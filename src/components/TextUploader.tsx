import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { addMultipleVocabularyWords } from "@/utils/vocabularyService";
import { XCircle } from "lucide-react";

interface TextUploaderProps {
  onFileImported?: () => void;
}

// Define the import status type to ensure string literal types can be properly compared
type ImportStatus = "extracted" | "imported" | "ready" | "none" | "processing";

const TextUploader: React.FC<TextUploaderProps> = ({ onFileImported }) => {
  const { toast } = useToast();
  const [text, setText] = useState<string>("");
	const [source, setSource] = useState<string>("");
  const [extractedWords, setExtractedWords] = useState<Array<{ german: string; english: string; difficulty?: number }>>([]);
  const [importStatus, setImportStatus] = useState<ImportStatus>("none");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const extractVocabulary = useCallback(() => {
    if (!text.trim()) {
      toast({
        title: "No Text Provided",
        description: "Please paste the text containing vocabulary words.",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    setImportStatus("processing");
    
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
  }, [text, toast]);
  
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
  };
  
  const handleClear = () => {
    setText("");
    setSource("");
    setExtractedWords([]);
    setImportStatus("none");
  };
  
  const handleRemoveWord = (index: number) => {
    const updatedWords = [...extractedWords];
    updatedWords.splice(index, 1);
    setExtractedWords(updatedWords);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Import Vocabulary from Text</CardTitle>
        <CardDescription>
          Paste text with German words and their English translations.
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
          <Label htmlFor="vocabulary">Vocabulary Text</Label>
          <Textarea
            id="vocabulary"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="German - English"
            className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
          />
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
        {importStatus === "extracted" || importStatus === "imported" ? (
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
