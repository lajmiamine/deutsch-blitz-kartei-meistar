
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { extractVocabularyFromText, ParsedWord } from "@/utils/textParser";
import { addMultipleVocabularyWords } from "@/utils/vocabularyService";
import { Text, Check, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface TextUploaderProps {
  onWordsExtracted?: (words: Array<{ german: string; english: string }>) => void;
}

// Language options for source and target
const languages = [
  { value: "de", label: "German" },
  { value: "en", label: "English" },
  { value: "fr", label: "French" },
  { value: "es", label: "Spanish" },
  { value: "it", label: "Italian" }
];

const TextUploader = ({ onWordsExtracted }: TextUploaderProps) => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [extractedWords, setExtractedWords] = useState<ParsedWord[]>([]);
  const [importStatus, setImportStatus] = useState<"idle" | "processing" | "extracted" | "imported">("idle");
  
  // New state for language selection
  const [sourceLanguage, setSourceLanguage] = useState<string>("de");
  const [targetLanguage, setTargetLanguage] = useState<string>("en");
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  
  // State for word selection
  const [selectedWords, setSelectedWords] = useState<Record<string, boolean>>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.toLowerCase().endsWith(".txt")) {
        setFile(selectedFile);
        setError(null);
        setImportStatus("idle");
        setExtractedWords([]);
        setSelectedWords({});
      } else {
        setFile(null);
        setError("Please upload a .txt file.");
      }
    }
  };

  const handleExtractWords = async () => {
    if (!file) {
      setError("No file selected.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);
    setImportStatus("processing");
    setShowLanguageSelector(true);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => (prev < 90 ? prev + 10 : prev));
    }, 200);

    try {
      const words = await extractVocabularyFromText(file);
      setExtractedWords(words);
      
      // Pre-select all words by default
      const initialSelection: Record<string, boolean> = {};
      words.forEach((word, index) => {
        initialSelection[index.toString()] = true;
      });
      setSelectedWords(initialSelection);
      
      setImportStatus("extracted");
      setUploadProgress(100);
      
      toast({
        title: "Words Extracted",
        description: `Successfully extracted ${words.length} words from the text file.`,
      });
    } catch (err) {
      setError("Failed to extract vocabulary from the text file. Please check the file format.");
      console.error(err);
      setImportStatus("idle");
      setShowLanguageSelector(false);
    } finally {
      clearInterval(progressInterval);
      setIsUploading(false);
    }
  };

  const handleImportWords = () => {
    if (extractedWords.length === 0) {
      toast({
        title: "No Words to Import",
        description: "Please extract words from a text file first.",
        variant: "destructive",
      });
      return;
    }

    // Filter only selected words
    const selectedWordsToImport = extractedWords.filter((_, index) => 
      selectedWords[index.toString()] === true
    );

    if (selectedWordsToImport.length === 0) {
      toast({
        title: "No Words Selected",
        description: "Please select at least one word to import.",
        variant: "destructive",
      });
      return;
    }

    try {
      addMultipleVocabularyWords(selectedWordsToImport);
      setImportStatus("imported");
      
      toast({
        title: "Import Successful",
        description: `${selectedWordsToImport.length} words have been added to your vocabulary.`,
      });
      
      if (onWordsExtracted) {
        onWordsExtracted(selectedWordsToImport);
      }
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Failed to import vocabulary words.",
        variant: "destructive",
      });
    }
  };

  const toggleWordSelection = (index: string) => {
    setSelectedWords(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleSelectAll = (selected: boolean) => {
    const newSelection: Record<string, boolean> = {};
    extractedWords.forEach((_, index) => {
      newSelection[index.toString()] = selected;
    });
    setSelectedWords(newSelection);
  };

  // Count selected words
  const selectedCount = Object.values(selectedWords).filter(Boolean).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Vocabulary from Text</CardTitle>
        <CardDescription>
          Upload a text file to extract and translate vocabulary words
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Input
            id="text"
            type="file"
            accept=".txt"
            onChange={handleFileChange}
            disabled={isUploading || importStatus === "extracted"}
          />
          <Button
            onClick={handleExtractWords}
            disabled={!file || isUploading || importStatus === "extracted"}
            className="whitespace-nowrap"
          >
            {isUploading ? "Processing..." : "Extract Words"}
          </Button>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
            {error}
          </div>
        )}

        {uploadProgress > 0 && importStatus === "processing" && (
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-german-gold h-2.5 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}

        {showLanguageSelector && (
          <div className="border rounded-md p-4 space-y-4">
            <h3 className="font-medium mb-2">Select Languages</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Source Language:</label>
                <Select
                  value={sourceLanguage}
                  onValueChange={setSourceLanguage}
                  disabled={importStatus === "extracted"}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select source language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Target Language:</label>
                <Select
                  value={targetLanguage}
                  onValueChange={setTargetLanguage}
                  disabled={importStatus === "extracted"}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select target language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {importStatus === "extracted" && (
          <div className="border rounded-md p-4 mt-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium">
                Extracted {extractedWords.length} words:
              </h3>
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectAll(true)}
                >
                  <Check className="w-4 h-4 mr-1" /> Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectAll(false)}
                >
                  <X className="w-4 h-4 mr-1" /> Deselect All
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {selectedCount} of {extractedWords.length} words selected for import
            </p>
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-1 w-10">Import</th>
                    <th className="text-left py-2 px-1">
                      {sourceLanguage === "de" ? "German" : 
                       sourceLanguage === "en" ? "English" :
                       sourceLanguage === "fr" ? "French" :
                       sourceLanguage === "es" ? "Spanish" :
                       sourceLanguage === "it" ? "Italian" : "Source"}
                    </th>
                    <th className="text-left py-2 px-1">
                      {targetLanguage === "de" ? "German" : 
                       targetLanguage === "en" ? "English" :
                       targetLanguage === "fr" ? "French" :
                       targetLanguage === "es" ? "Spanish" :
                       targetLanguage === "it" ? "Italian" : "Target"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {extractedWords.map((word, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-1 px-1">
                        <Checkbox
                          checked={selectedWords[index.toString()] === true}
                          onCheckedChange={() => toggleWordSelection(index.toString())}
                        />
                      </td>
                      <td className="py-1 px-1">{word.german}</td>
                      <td className="py-1 px-1">{word.english}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleImportWords}
          disabled={importStatus !== "extracted" || selectedCount === 0}
          className="w-full"
        >
          {importStatus === "imported"
            ? "Words Imported Successfully"
            : `Import ${selectedCount} Selected Words`}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TextUploader;
