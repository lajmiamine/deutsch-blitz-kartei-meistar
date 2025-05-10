import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import Navbar from "@/components/Navbar";
import TextUploader from "@/components/TextUploader";
import VocabularyList from "@/components/VocabularyList";
import {
  VocabularyWord,
  getVocabulary,
  addVocabularyWord,
  updateWordApproval,
  deleteVocabularyWord,
  updateVocabularyWord,
  addMultipleVocabularyWords,
  clearVocabulary
} from "@/utils/vocabularyService";

const AdminPanel = () => {
  const { toast } = useToast();
  const [vocabulary, setVocabulary] = useState<VocabularyWord[]>([]);
  const [newGerman, setNewGerman] = useState("");
  const [newEnglish, setNewEnglish] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check admin status from localStorage
    const adminStatus = localStorage.getItem("isAdmin") === "true";
    setIsAdmin(adminStatus);
    
    // Load vocabulary
    const loadVocabulary = () => {
      const words = getVocabulary();
      setVocabulary(words);
    };
    
    loadVocabulary();
  }, []);

  const handleTextWordsExtracted = (words: Array<{ german: string; english: string }>) => {
    addMultipleVocabularyWords(words);
    setVocabulary(getVocabulary());
    
    toast({
      title: "Words Imported",
      description: `Added ${words.length} words from text file. They need approval before being used in flashcards.`,
      duration: 5000,
    });
  };

  const handleAddWord = () => {
    if (newGerman.trim() && newEnglish.trim()) {
      addVocabularyWord(newGerman.trim(), newEnglish.trim(), true);
      setNewGerman("");
      setNewEnglish("");
      
      // Refresh vocabulary list
      setVocabulary(getVocabulary());
      
      toast({
        title: "Word Added",
        description: `Added "${newGerman}" to vocabulary.`,
        duration: 3000,
      });
    } else {
      toast({
        title: "Error",
        description: "Both German and English words are required.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleApproveWord = (id: string, approved: boolean) => {
    updateWordApproval(id, approved);
    setVocabulary(getVocabulary());
    
    toast({
      title: approved ? "Word Approved" : "Word Unapproved",
      description: "The vocabulary word has been updated.",
      duration: 2000,
    });
  };

  const handleDeleteWord = (id: string) => {
    deleteVocabularyWord(id);
    setVocabulary(getVocabulary());
    
    toast({
      title: "Word Deleted",
      description: "The vocabulary word has been removed.",
      duration: 2000,
    });
  };

  const handleEditWord = (id: string, german: string, english: string) => {
    updateVocabularyWord(id, german, english);
    setVocabulary(getVocabulary());
    
    toast({
      title: "Word Updated",
      description: "The vocabulary word has been edited.",
      duration: 2000,
    });
  };

  const handleResetVocabulary = () => {
    if (window.confirm("Are you sure you want to reset all vocabulary? This cannot be undone.")) {
      clearVocabulary();
      setVocabulary(getVocabulary());
      
      toast({
        title: "Vocabulary Reset",
        description: "All vocabulary has been reset to the default words.",
        duration: 3000,
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container py-16 max-w-4xl text-center">
          <h1 className="text-3xl font-bold mb-4">Admin Access Required</h1>
          <p className="mb-6">You need admin access to view this page.</p>
          <p className="text-sm text-muted-foreground mb-4">
            Click the "Admin Mode" button in the navigation bar to enable admin access.
          </p>
          <Button asChild>
            <a href="/">Return to Home</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>
        
        <Tabs defaultValue="vocabulary" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="vocabulary">Vocabulary Management</TabsTrigger>
            <TabsTrigger value="textimport">Import from Text</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="vocabulary">
            <Card>
              <CardHeader>
                <CardTitle>Add New Vocabulary</CardTitle>
                <CardDescription>
                  Add new German-English word pairs to the vocabulary database.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <Input
                    placeholder="German word"
                    value={newGerman}
                    onChange={(e) => setNewGerman(e.target.value)}
                  />
                  <Input
                    placeholder="English translation"
                    value={newEnglish}
                    onChange={(e) => setNewEnglish(e.target.value)}
                  />
                </div>
                <Button onClick={handleAddWord}>Add Word</Button>
              </CardContent>
            </Card>

            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Vocabulary List</h3>
              <VocabularyList
                words={vocabulary}
                onApproveWord={handleApproveWord}
                onDeleteWord={handleDeleteWord}
                onEditWord={handleEditWord}
              />
            </div>
          </TabsContent>

          <TabsContent value="textimport">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <TextUploader onWordsExtracted={handleTextWordsExtracted} />
              
              <Card>
                <CardHeader>
                  <CardTitle>Text Import Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-muted-foreground">
                    Upload text files containing words you want to learn. The system will extract words that are 4 letters or longer.
                  </p>
                  <p className="mb-4 text-muted-foreground">
                    Select the source language of your text and the target language for translations. Review the extracted words and select which ones you want to import.
                  </p>
                  <p className="text-muted-foreground">
                    <strong>Note:</strong> After import, you'll need to approve the words in the Vocabulary Management section before they appear in flashcards.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Vocabulary Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="mb-2 text-sm text-muted-foreground">
                    Reset vocabulary to default values. This will remove all custom words.
                  </p>
                  <Button variant="destructive" onClick={handleResetVocabulary}>
                    Reset Vocabulary
                  </Button>
                </div>
                
                <div className="pt-4 border-t">
                  <p className="mb-2 font-medium">Statistics</p>
                  <p className="text-sm text-muted-foreground">
                    Total Words: {vocabulary.length}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Approved Words: {vocabulary.filter(w => w.approved).length}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Pending Approval: {vocabulary.filter(w => !w.approved).length}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
