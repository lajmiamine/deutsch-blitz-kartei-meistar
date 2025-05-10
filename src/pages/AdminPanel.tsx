
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
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
  clearVocabulary,
  getAllSources
} from "@/utils/vocabularyService";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { FileText } from "lucide-react";

const AdminPanel = () => {
  const { toast } = useToast();
  const [vocabulary, setVocabulary] = useState<VocabularyWord[]>([]);
  const [newGerman, setNewGerman] = useState("");
  const [newEnglish, setNewEnglish] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [fileSources, setFileSources] = useState<string[]>([]);
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);

  useEffect(() => {
    // Check admin status from localStorage
    const adminStatus = localStorage.getItem("isAdmin") === "true";
    setIsAdmin(adminStatus);
    
    // Load vocabulary
    const loadVocabulary = () => {
      const words = getVocabulary();
      setVocabulary(words);
      
      // Get all available file sources
      const sources = getAllSources();
      setFileSources(sources);
    };
    
    loadVocabulary();
  }, []);

  const handleTextWordsExtracted = (
    words: Array<{ german: string; english: string }>,
    source?: string
  ) => {
    addMultipleVocabularyWords(words, source);
    
    // Refresh vocabulary and sources
    setVocabulary(getVocabulary());
    setFileSources(getAllSources());
    
    toast({
      title: "Words Imported",
      description: `Added ${words.length} words from text file${source ? ` "${source}"` : ''}. They need approval before being used in flashcards.`,
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
      setFileSources([]);
      
      toast({
        title: "Vocabulary Reset",
        description: "All vocabulary has been reset to the default words.",
        duration: 3000,
      });
    }
  };

  // Filter vocabulary by source
  const filteredVocabulary = selectedSource 
    ? vocabulary.filter(word => word.source === selectedSource)
    : vocabulary;

  // View words from a specific source
  const handleViewSourceWords = (source: string) => {
    setSelectedSource(source);
    
    toast({
      title: "Source Filter Applied",
      description: `Showing words imported from "${source}"`,
      duration: 2000,
    });
  };

  // Clear source filter
  const clearSourceFilter = () => {
    setSelectedSource("");
  };

  // Create flashcards from a specific source
  const handleCreateSourceFlashcards = (source: string) => {
    // Get the source words and ensure they're approved
    const sourceWords = vocabulary.filter(word => word.source === source);
    
    // Check if there are any words from this source
    if (sourceWords.length === 0) {
      toast({
        title: "No Words Found",
        description: `No words found from source "${source}"`,
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    // Count approved words
    const approvedWords = sourceWords.filter(word => word.approved);
    
    // If no approved words, inform the user
    if (approvedWords.length === 0) {
      toast({
        title: "No Approved Words",
        description: `There are no approved words from "${source}". Please approve some words first.`,
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    // Store the selected source in localStorage for the game to use
    localStorage.setItem("flashcard_source", source);
    
    toast({
      title: "Flashcards Ready",
      description: `${approvedWords.length} words from "${source}" are ready for the flashcard game.`,
      duration: 3000,
    });
    
    // Navigate to the flashcard game
    window.location.href = "/flashcards";
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
            <TabsTrigger value="sources">File Sources</TabsTrigger>
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
              {selectedSource && (
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      Filtering by source: "{selectedSource}"
                    </span>
                  </div>
                  <Button variant="outline" size="sm" onClick={clearSourceFilter}>
                    Clear Filter
                  </Button>
                </div>
              )}
              
              <h3 className="text-xl font-semibold mb-4">
                {selectedSource 
                  ? `Words from "${selectedSource}" (${filteredVocabulary.length})` 
                  : `Vocabulary List (${vocabulary.length})`
                }
              </h3>
              
              <VocabularyList
                words={filteredVocabulary}
                onApproveWord={handleApproveWord}
                onDeleteWord={handleDeleteWord}
                onEditWord={handleEditWord}
              />
            </div>
          </TabsContent>

          <TabsContent value="textimport">
            <TextUploader onWordsExtracted={handleTextWordsExtracted} />
          </TabsContent>

          <TabsContent value="sources">
            <Card>
              <CardHeader>
                <CardTitle>Text File Sources</CardTitle>
                <CardDescription>
                  View and manage vocabulary words by their source text files
                </CardDescription>
              </CardHeader>
              <CardContent>
                {fileSources.length === 0 ? (
                  <div className="text-center py-8 border rounded-md">
                    <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      No text files have been imported yet. 
                      Import a text file from the "Import from Text" tab.
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px] rounded-md border p-4">
                    <div className="space-y-2">
                      {fileSources.map((source) => {
                        const sourceWords = vocabulary.filter(word => word.source === source);
                        const approvedCount = sourceWords.filter(word => word.approved).length;
                        
                        return (
                          <Collapsible
                            key={source}
                            open={isSourcesOpen}
                            onOpenChange={setIsSourcesOpen}
                            className="border rounded-md"
                          >
                            <div className="flex items-center justify-between p-4">
                              <div>
                                <CollapsibleTrigger asChild>
                                  <Button variant="ghost" className="p-0 hover:bg-transparent">
                                    <FileText className="h-4 w-4 mr-2" />
                                    <span className="font-medium">{source}</span>
                                  </Button>
                                </CollapsibleTrigger>
                                <div className="text-sm text-muted-foreground mt-1">
                                  {sourceWords.length} words ({approvedCount} approved)
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewSourceWords(source)}
                                >
                                  View Words
                                </Button>
                                
                                <Button 
                                  size="sm" 
                                  onClick={() => handleCreateSourceFlashcards(source)}
                                  disabled={approvedCount === 0}
                                >
                                  Create Flashcards
                                </Button>
                              </div>
                            </div>
                            
                            <CollapsibleContent className="p-4 pt-0 border-t">
                              <div className="text-sm space-y-1">
                                <p><strong>Total Words:</strong> {sourceWords.length}</p>
                                <p><strong>Approved Words:</strong> {approvedCount}</p>
                                <p><strong>Pending Approval:</strong> {sourceWords.length - approvedCount}</p>
                                {approvedCount === 0 && (
                                  <p className="text-amber-600">
                                    You need to approve some words before creating flashcards.
                                  </p>
                                )}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
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
                  <p className="text-sm text-muted-foreground">
                    Imported Files: {fileSources.length}
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
