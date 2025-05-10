
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { extractVocabularyFromPDF } from "@/utils/pdfParser";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface PDFUploaderProps {
  onWordsExtracted: (words: Array<{ german: string; english: string }>) => void;
}

const PDFUploader = ({ onWordsExtracted }: PDFUploaderProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [extractedCount, setExtractedCount] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === "application/pdf") {
        setFile(selectedFile);
        setError(null);
      } else {
        setFile(null);
        setError("Please upload a PDF file.");
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("No file selected.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => (prev < 90 ? prev + 10 : prev));
    }, 200);

    try {
      const extractedWords = await extractVocabularyFromPDF(file);
      setExtractedCount(extractedWords.length);
      onWordsExtracted(extractedWords);
      setUploadProgress(100);
    } catch (err) {
      setError("Failed to extract vocabulary from the PDF. Please check the file format.");
      console.error(err);
    } finally {
      clearInterval(progressInterval);
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload PDF Vocabulary</CardTitle>
        <CardDescription>
          Upload a PDF containing vocabulary to extract German-English word pairs.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Input
              id="pdf"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          {uploadProgress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-german-gold h-2.5 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}

          {extractedCount > 0 && (
            <Alert>
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>
                Successfully extracted {extractedCount} vocabulary words from the PDF.
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="w-full"
          >
            {isUploading ? "Processing..." : "Extract Vocabulary"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PDFUploader;
