
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { extractVocabularyFromText, ParsedWord } from "@/utils/textParser";
import { addMultipleVocabularyWords } from "@/utils/vocabularyService";

interface TextUploaderProps {
  onWordsAdded?: (count: number) => void;
}

const TextUploader = ({ onWordsAdded }: TextUploaderProps) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedWords, setExtractedWords] = useState<ParsedWord[]>([]);
  const [importStatus, setImportStatus] = useState<"idle" | "processing" | "extracted" | "imported">("idle");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if it's a text file
    if (!file.name.toLowerCase().endsWith(".txt")) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a .txt file.",
        variant: "destructive",
      });
      return;
    }
    
    setUploadedFile(file);
    setImportStatus("idle");
    setExtractedWords([]);
  };

  const handleExtractWords = async () => {
    if (!uploadedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a text file first.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setImportStatus("processing");

    try {
      const words = await extractVocabularyFromText(uploadedFile);
      setExtractedWords(words);
      setImportStatus("extracted");
      
      toast({
        title: "Words Extracted",
        description: `Successfully extracted ${words.length} words from the text file.`,
      });
    } catch (error) {
      toast({
        title: "Extraction Failed",
        description: error instanceof Error ? error.message : "Failed to extract vocabulary from text file.",
        variant: "destructive",
      });
      setImportStatus("idle");
    } finally {
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
      
      if (onWordsAdded) {
        onWordsAdded(extractedWords.length);
      }
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
            type="file"
            accept=".txt"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          <Button
            onClick={handleExtractWords}
            disabled={!uploadedFile || isUploading}
            className="whitespace-nowrap"
          >
            {isUploading ? "Processing..." : "Extract Words"}
          </Button>
        </div>

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
