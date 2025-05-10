
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { extractVocabularyFromText, ParsedWord } from "@/utils/textParser";
import { addMultipleVocabularyWords } from "@/utils/vocabularyService";
import { Check, X, Info, FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  HoverCard, 
  HoverCardContent, 
  HoverCardTrigger 
} from "@/components/ui/hover-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TextUploaderProps {
  onWordsExtracted?: (words: Array<{ german: string; english: string }>, source?: string) => void;
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
  
  // File source tracking
  const [fileSource, setFileSource] = useState<string>("");
  
  // Language selection
  const [sourceLanguage, setSourceLanguage] = useState<string>("de");
  const [targetLanguage, setTargetLanguage] = useState<string>("en");
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  
  // Word selection
  const [selectedWords, setSelectedWords] = useState<Record<string, boolean>>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.toLowerCase().endsWith(".txt")) {
        setFile(selectedFile);
        // Use the filename (without extension) as the source identifier
        setFileSource(selectedFile.name.replace(/\.[^/.]+$/, ""));
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
      // Pass the selected languages to the extraction function
      const words = await extractVocabularyFromText(file, sourceLanguage, targetLanguage);
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
      // Pass the file source to track where words came from
      addMultipleVocabularyWords(selectedWordsToImport, fileSource);
      setImportStatus("imported");
      
      toast({
        title: "Import Successful",
        description: `${selectedWordsToImport.length} words have been added to your vocabulary from "${fileSource}".`,
      });
      
      if (onWordsExtracted) {
        onWordsExtracted(selectedWordsToImport, fileSource);
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
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>Import Vocabulary from Text</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Info className="h-4 w-4" />
                    <span className="sr-only">Text import information</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p>Upload a .txt file to extract words (4+ letters) for your vocabulary list. 
                  Words will be translated between your selected languages.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <CardDescription>
          Upload a text file to extract and translate vocabulary words
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Input
              id="text"
              type="file"
              accept=".txt"
              onChange={handleFileChange}
              disabled={isUploading || importStatus === "extracted"}
              className="cursor-pointer"
            />
            <FileText className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
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
              className="bg-primary h-2.5 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}

        {showLanguageSelector && (
          <div className="border rounded-md p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium mb-2">Select Languages</h3>
              <HoverCard>
                <HoverCardTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Info className="h-4 w-4" />
                  </Button>
                </HoverCardTrigger>
                <HoverCardContent side="top" className="w-80">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Language Selection Tips:</h4>
                    <p className="text-sm">
                      Select the language of your text file as the "Source Language". 
                      This is the language your uploaded text is written in.
                    </p>
                    <p className="text-sm">
                      Choose the language you want translations in as the "Target Language".
                      Words will be added to your vocabulary with both languages.
                    </p>
                  </div>
                </HoverCardContent>
              </HoverCard>
            </div>
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
                Extracted {extractedWords.length} words from "{fileSource}":
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
            
            <ScrollArea className="h-96 rounded border p-2">
              <div className="w-full">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b sticky top-0 bg-background z-10">
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
                      <tr key={index} className="border-b border-gray-100 hover:bg-muted/50">
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
            </ScrollArea>
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
            : `Import ${selectedCount} Selected Words from "${fileSource}"`}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TextUploader;
