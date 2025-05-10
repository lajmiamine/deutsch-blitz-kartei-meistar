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
  updateWordDifficulty,
  addMultipleVocabularyWords,
  clearVocabulary,
  getAllSources,
  getVocabularyBySource,
  getApprovedVocabularyBySource,
  deleteWordsBySource,
  updateDifficultyBySource,
  updateSourceName
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FileText, Trash, Settings, Edit } from "lucide-react";

const AdminPanel = () => {
  const { toast } = useToast();
  const [vocabulary, setVocabulary] = useState<VocabularyWord[]>([]);
  const [newGerman, setNewGerman] = useState("");
  const [newEnglish, setNewEnglish] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [fileSources, setFileSources] = useState<string[]>([]);
  const [selectedSource, setSelectedSource] = useState<string | undefined>(undefined);
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("vocabulary");
  const [currentSourceForDifficulty, setCurrentSourceForDifficulty] = useState<string | null>(null);
  const [isDifficultyDialogOpen, setIsDifficultyDialogOpen] = useState(false);
  
  // For source rename functionality
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [currentSourceToRename, setCurrentSourceToRename] = useState<string | null>(null);
  const [newSourceName, setNewSourceName] = useState("");

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
      description: `Added ${words.length} words from text file${source ? ` "${source}"` : ''}. Words are automatically approved.`,
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
    
    // Update the local state to make sure the checkbox state changes immediately
    setVocabulary(prev => {
      return prev.map(word => {
        if (word.id === id) {
          return { ...word, approved };
        }
        return word;
      });
    });
    
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

  const handleDeleteWordsBySource = (source: string) => {
    const deletedCount = deleteWordsBySource(source);
    
    // Refresh vocabulary and sources lists
    const updatedVocabulary = getVocabulary();
    setVocabulary(updatedVocabulary);
    
    // Check if there are any words left from this source
    const remainingSourceWords = updatedVocabulary.filter(w => w.source === source);
    if (remainingSourceWords.length === 0) {
      // No more words from this source, update sources list
      setFileSources(getAllSources());
      setSelectedSource(undefined); // Clear the source filter if it was set
    }
    
    toast({
      title: "Words Deleted",
      description: `Deleted ${deletedCount} words from "${source}".`,
      duration: 3000,
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

  const handleUpdateDifficulty = (id: string, difficulty: number) => {
    updateWordDifficulty(id, difficulty);
    
    // Update the local state
    setVocabulary(prev => {
      return prev.map(word => {
        if (word.id === id) {
          return { ...word, difficulty };
        }
        return word;
      });
    });
    
    const difficultyLabels = ["Unknown", "Easy", "Medium", "Hard"];
    
    toast({
      title: "Difficulty Updated",
      description: `Word difficulty set to "${difficultyLabels[difficulty] || 'Unknown'}".`,
      duration: 2000,
    });
  };

  const handleUpdateDifficultyBySource = (source: string, difficulty: number) => {
    const updatedCount = updateDifficultyBySource(source, difficulty);
    
    // Refresh vocabulary
    setVocabulary(getVocabulary());
    
    const difficultyLabels = ["Unknown", "Easy", "Medium", "Hard"];
    
    // Close the dialog
    setIsDifficultyDialogOpen(false);
    
    toast({
      title: "Difficulty Updated",
      description: `Updated ${updatedCount} words from "${source}" to "${difficultyLabels[difficulty] || 'Unknown'}" difficulty.`,
      duration: 3000,
    });
  };

  const handleResetVocabulary = () => {
    if (window.confirm("Are you sure you want to reset all vocabulary? This cannot be undone.")) {
      clearVocabulary();
      setVocabulary(getVocabulary());
      setFileSources([]);
      setSelectedSource(undefined);
      
      toast({
        title: "Vocabulary Reset",
        description: "All vocabulary has been reset to the default words.",
        duration: 3000,
      });
    }
  };

  // View words from a specific source
  const handleViewSourceWords = (source: string) => {
    setSelectedSource(source);
    setActiveTab("vocabulary"); // Switch to vocabulary tab to show the filtered words
    
    toast({
      title: "Source Filter Applied",
      description: `Showing words imported from "${source}"`,
      duration: 2000,
    });
  };

  // Clear source filter
  const handleClearSourceFilter = () => {
    setSelectedSource(undefined);
  };

  // Open difficulty dialog
  const handleOpenDifficultyDialog = (source: string) => {
    setCurrentSourceForDifficulty(source);
    setIsDifficultyDialogOpen(true);
  };

  // Create flashcards from a specific source
  const handleCreateSourceFlashcards = (source: string) => {
    // Get the source words and ensure they're approved
    const approvedWords = getApprovedVocabularyBySource(source);
    
    // Check if there are any approved words from this source
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

  const handleSourceChange = (source: string | undefined) => {
    setSelectedSource(source);
  };

  // Open rename dialog
  const handleOpenRenameDialog = (source: string) => {
    setCurrentSourceToRename(source);
    setNewSourceName(source); // Pre-fill with current source name
    setIsRenameDialogOpen(true);
  };

  // Update source name
  const handleUpdateSourceName = () => {
    if (!currentSourceToRename || !newSourceName.trim()) {
      toast({
        title: "Error",
        description: "Source name cannot be empty.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    const result = updateSourceName(currentSourceToRename, newSourceName.trim());
    
    if (result === -1) {
      toast({
        title: "Error",
        description: `A source with the name "${newSourceName.trim()}" already exists.`,
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    // Update local data
    setFileSources(getAllSources());
    setVocabulary(getVocabulary());
    
    // If the renamed source was the selected one, update the selection
    if (selectedSource === currentSourceToRename) {
      setSelectedSource(newSourceName.trim());
    }
    
    toast({
      title: "Source Renamed",
      description: `Renamed "${currentSourceToRename}" to "${newSourceName.trim()}"`,
      duration: 3000,
    });
    
    // Close the dialog
    setIsRenameDialogOpen(false);
    setCurrentSourceToRename(null);
  };

  // Handle tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
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
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
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
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Vocabulary Management</h3>
                {selectedSource && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      Showing words from: <span className="text-blue-600">{selectedSource}</span>
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleClearSourceFilter}
                    >
                      Clear Filter
                    </Button>
                  </div>
                )}
              </div>
              
              <VocabularyList
                onApproveWord={handleApproveWord}
                onDeleteWord={handleDeleteWord}
                onEditWord={handleEditWord}
                onUpdateDifficulty={handleUpdateDifficulty}
                selectedSource={selectedSource}
                sources={fileSources}
                onSourceChange={handleSourceChange}
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
                        const sourceWords = getVocabularyBySource(source);
                        const approvedCount = sourceWords.filter(word => word.approved).length;
                        
                        return (
                          <Collapsible
                            key={source}
                            open={isSourcesOpen}
                            onOpenChange={setIsSourcesOpen}
                            className="border rounded-md"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3">
                              <div className="flex-shrink-0 max-w-full">
                                <CollapsibleTrigger asChild>
                                  <Button variant="ghost" className="p-0 hover:bg-transparent text-left justify-start break-all">
                                    <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                                    <span className="font-medium truncate">
                                      {source === "all-words" ? "All words" : source}
                                    </span>
                                  </Button>
                                </CollapsibleTrigger>
                                <div className="text-sm text-muted-foreground mt-1">
                                  {sourceWords.length} words ({approvedCount} approved)
                                </div>
                              </div>
                              
                              <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewSourceWords(source)}
                                  className="flex-shrink-0"
                                >
                                  View Words
                                </Button>
                                
                                <Button 
                                  size="sm" 
                                  onClick={() => handleCreateSourceFlashcards(source)}
                                  className="flex-shrink-0"
                                >
                                  Create Flashcards
                                </Button>
                                
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="flex items-center gap-1 flex-shrink-0"
                                  onClick={() => handleOpenDifficultyDialog(source)}
                                >
                                  <Settings className="h-4 w-4" />
                                  <span className="hidden sm:inline">Set Difficulty</span>
                                </Button>
                                
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="flex items-center gap-1 flex-shrink-0"
                                  onClick={() => handleOpenRenameDialog(source)}
                                >
                                  <Edit className="h-4 w-4" />
                                  <span className="hidden sm:inline">Rename</span>
                                </Button>
                                
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      size="sm" 
                                      variant="destructive"
                                      className="flex-shrink-0"
                                    >
                                      <Trash className="h-4 w-4 mr-1" />
                                      <span className="hidden sm:inline">Delete All</span>
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete all words from this source?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently delete all {sourceWords.length} words imported from "{source}". 
                                        This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => handleDeleteWordsBySource(source)} 
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Delete All Words
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                            
                            <CollapsibleContent className="p-4 pt-0 border-t">
                              <div className="text-sm space-y-1">
                                <p><strong>Total Words:</strong> {sourceWords.length}</p>
                                <p><strong>Approved Words:</strong> {approvedCount}</p>
                                <p><strong>Pending Approval:</strong> {sourceWords.length - approvedCount}</p>
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
      
      {/* Dialog for setting difficulty levels */}
      <Dialog open={isDifficultyDialogOpen} onOpenChange={setIsDifficultyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Difficulty</DialogTitle>
            <DialogDescription>
              {currentSourceForDifficulty && (
                <>Set difficulty level for all words imported from "{currentSourceForDifficulty}".</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <p className="text-sm font-medium">Choose difficulty level:</p>
            <div className="flex flex-col gap-2 mt-2">
              <Button 
                variant="outline"
                className="justify-start"
                onClick={() => currentSourceForDifficulty && handleUpdateDifficultyBySource(currentSourceForDifficulty, 1)}
              >
                Easy (1)
              </Button>
              <Button 
                variant="outline"
                className="justify-start"
                onClick={() => currentSourceForDifficulty && handleUpdateDifficultyBySource(currentSourceForDifficulty, 2)}
              >
                Medium (2)
              </Button>
              <Button 
                variant="outline"
                className="justify-start"
                onClick={() => currentSourceForDifficulty && handleUpdateDifficultyBySource(currentSourceForDifficulty, 3)}
              >
                Hard (3)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Dialog for renaming sources */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Source</DialogTitle>
            <DialogDescription>
              {currentSourceToRename && (
                <>Enter a new name for the source "{currentSourceToRename}".</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newSourceName}
              onChange={(e) => setNewSourceName(e.target.value)}
              placeholder="New source name"
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSourceName}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;
