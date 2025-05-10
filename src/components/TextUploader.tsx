
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { extractVocabularyFromText, ParsedWord } from "@/utils/textParser";
import { addMultipleVocabularyWords } from "@/utils/vocabularyService";
import { Text } from "lucide-react";

interface TextUploaderProps {
  onWordsExtracted?: (words: Array<{ german: string; english: string }>) => void;
}

const TextUploader = ({ onWordsExtracted }: TextUploaderProps) => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [extractedWords, setExtractedWords] = useState<ParsedWord[]>([]);
  const [importStatus, setImportStatus] = useState<"idle" | "processing" | "extracted" | "imported">("idle");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.toLowerCase().endsWith(".txt")) {
        setFile(selectedFile);
        setError(null);
        setImportStatus("idle");
        setExtractedWords([]);
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
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => (prev < 90 ? prev + 10 : prev));
    }, 200);

    try {
      const words = await extractVocabularyFromText(file);
      setExtractedWords(words);
      setImportStatus("extracted");
      setUploadProgress(100);
      
      toast({
        title: "Words Extracted",
        description: `Successfully extracted ${words.length} words from the text file.`,
      });
      
      if (onWordsExtracted) {
        onWordsExtracted(words);
      }
    } catch (err) {
      setError("Failed to extract vocabulary from the text file. Please check the file format.");
      console.error(err);
      setImportStatus("idle");
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

    try {
      addMultipleVocabularyWords(extractedWords);
      setImportStatus("imported");
      
      toast({
        title: "Import Successful",
        description: `${extractedWords.length} words have been added to your vocabulary.`,
      });
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Failed to import vocabulary words.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Vocabulary from Text</CardTitle>
        <CardDescription>
          Upload a German text file to extract vocabulary words
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Input
            id="text"
            type="file"
            accept=".txt"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          <Button
            onClick={handleExtractWords}
            disabled={!file || isUploading}
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

        {importStatus === "extracted" && (
          <div className="border rounded-md p-4 mt-4">
            <h3 className="font-medium mb-2">
              Extracted {extractedWords.length} words:
            </h3>
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-1">German</th>
                    <th className="text-left py-2 px-1">English</th>
                  </tr>
                </thead>
                <tbody>
                  {extractedWords.map((word, index) => (
                    <tr key={index} className="border-b border-gray-100">
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
          disabled={importStatus !== "extracted" || extractedWords.length === 0}
          className="w-full"
        >
          {importStatus === "imported"
            ? "Words Imported Successfully"
            : `Import ${extractedWords.length} Words`}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TextUploader;
