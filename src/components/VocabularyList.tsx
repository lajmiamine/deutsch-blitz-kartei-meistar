import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VocabularyWord, getPaginatedVocabulary, updateWordsSource } from "@/utils/vocabularyService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Search, ChevronLeft, ChevronRight, ArrowUpDown, Check, SortAsc, SortDesc, Pencil, Trash } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface VocabularyListProps {
  words?: VocabularyWord[];
  onApproveWord: (id: string, approved: boolean) => void;
  onDeleteWord: (id: string) => void;
  onEditWord: (id: string, german: string, english: string) => void;
  onUpdateDifficulty?: (id: string, difficulty: number) => void;
  selectedSource?: string;
  sources?: string[];
  onSourceChange?: (source: string | undefined) => void;
}

const VocabularyList = ({ 
  words: propWords, 
  onApproveWord, 
  onDeleteWord, 
  onEditWord,
  onUpdateDifficulty,
  selectedSource,
  sources = [],
  onSourceChange
}: VocabularyListProps) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editGerman, setEditGerman] = useState("");
  const [editEnglish, setEditEnglish] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalWords, setTotalWords] = useState(0);
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [sortBy, setSortBy] = useState<string>("german");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isSourceDialogOpen, setIsSourceDialogOpen] = useState(false);
  const [newSource, setNewSource] = useState<string>("");

  // Load words with pagination if propWords is not provided
  useEffect(() => {
    if (propWords) {
      // When using provided words directly, we need to sort them manually here
      let sortedWords = [...propWords];
      
      // Apply sorting based on sortBy and sortDirection
      sortedWords.sort((a, b) => {
        let compareVal = 0;
        
        switch (sortBy) {
          case 'german':
            compareVal = a.german.localeCompare(b.german);
            break;
          case 'english':
            compareVal = a.english.localeCompare(b.english);
            break;
          case 'difficulty':
            compareVal = (a.difficulty || 0) - (b.difficulty || 0);
            break;
          case 'approved':
            // Sort by boolean values (true values first when ascending)
            compareVal = a.approved === b.approved ? 0 : a.approved ? -1 : 1;
            break;
          case 'source':
            // Handle undefined sources properly for sorting
            const sourceA = a.source || '';
            const sourceB = b.source || '';
            compareVal = sourceA.localeCompare(sourceB);
            break;
          case 'createdAt':
            compareVal = (a.createdAt || 0) - (b.createdAt || 0);
            break;
          case 'updatedAt':
            compareVal = (a.updatedAt || 0) - (b.updatedAt || 0);
            break;
          default:
            compareVal = a.german.localeCompare(b.german);
        }
        
        return sortDirection === 'asc' ? compareVal : -compareVal;
      });
      
      setWords(sortedWords);
      setTotalWords(sortedWords.length);
      return;
    }

    setLoading(true);
    
    // Use setTimeout to simulate API call and prevent UI freeze
    const timer = setTimeout(() => {
      const { words: paginatedWords, totalCount } = getPaginatedVocabulary(
        page,
        pageSize,
        searchTerm,
        selectedSource,
        sortBy,
        sortDirection
      );
      setWords(paginatedWords);
      setTotalWords(totalCount);
      setLoading(false);
      
      // Reset selection when data changes
      setSelectedWords([]);
      setIsAllSelected(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [page, pageSize, searchTerm, selectedSource, propWords, sortBy, sortDirection]);

  // Handle all selection checkbox
  useEffect(() => {
    setIsAllSelected(words.length > 0 && selectedWords.length === words.length);
  }, [selectedWords, words]);

  const startEditing = (word: VocabularyWord) => {
    setEditingId(word.id);
    setEditGerman(word.german);
    setEditEnglish(word.english);
  };

  const saveEdit = () => {
    if (editingId) {
      onEditWord(editingId, editGerman, editEnglish);
      setEditingId(null);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > Math.ceil(totalWords / pageSize)) {
      return;
    }
    setPage(newPage);
  };

  const totalPages = Math.ceil(totalWords / pageSize);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to first page when searching
  };

  const handleSourceChange = (value: string) => {
    if (onSourceChange) {
      onSourceChange(value === "all-sources" ? undefined : value);
      setPage(1); // Reset to first page when filter changes
    }
  };

  // Fix for the checkbox update issue - Create a handler that updates local state immediately
  const handleApproveWordWithStateUpdate = (id: string, approved: boolean) => {
    // Update the local words state immediately
    setWords(currentWords => 
      currentWords.map(word => 
        word.id === id ? { ...word, approved } : word
      )
    );
    
    // Call the parent component's handler
    onApproveWord(id, approved);
  };

  // Handle difficulty change with state update
  const handleDifficultyChange = (id: string, difficulty: string) => {
    if (!onUpdateDifficulty) return;
    
    const difficultyValue = parseInt(difficulty);
    
    // Update the local words state immediately
    setWords(currentWords => 
      currentWords.map(word => 
        word.id === id ? { ...word, difficulty: difficultyValue } : word
      )
    );
    
    // Call the parent component's handler
    onUpdateDifficulty(id, difficultyValue);
  };

  // Modified handleSort function to reset to page 1
  const handleSort = (column: string) => {
    // Prevent default link behavior
    event?.preventDefault?.();
    
    if (sortBy === column) {
      // Toggle direction if clicking the same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to ascending
      setSortBy(column);
      setSortDirection('asc');
    }
    
    // Reset to page 1 when changing sort
    setPage(1);
  };

  // Handle word selection
  const toggleWordSelection = (id: string) => {
    setSelectedWords(prev => {
      if (prev.includes(id)) {
        return prev.filter(wordId => wordId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Handle select all words
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedWords([]);
    } else {
      setSelectedWords(words.map(word => word.id));
    }
    setIsAllSelected(!isAllSelected);
  };

  // Open source update dialog
  const openSourceUpdateDialog = () => {
    if (selectedWords.length === 0) {
      toast({
        title: "No words selected",
        description: "Please select at least one word to update",
        variant: "destructive",
      });
      return;
    }
    setNewSource("");
    setIsSourceDialogOpen(true);
  };

  // Update source for selected words
  const handleUpdateSource = () => {
    if (newSource.trim() === "") {
      toast({
        title: "Error",
        description: "Source name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    const updatedCount = updateWordsSource(selectedWords, newSource.trim());
    
    // Update the local words state immediately
    setWords(currentWords => 
      currentWords.map(word => 
        selectedWords.includes(word.id) ? { ...word, source: newSource.trim() } : word
      )
    );
    
    // If onSourceChange is provided and we're currently filtering by source,
    // call it to refresh the parent component's state
    if (selectedSource && onSourceChange) {
      onSourceChange(selectedSource);
    }
    
    setIsSourceDialogOpen(false);
    setSelectedWords([]);
    
    toast({
      title: "Source Updated",
      description: `Updated source for ${updatedCount} words`,
    });
  };

  // Get sort icon for column
  const getSortIcon = (column: string) => {
    if (sortBy === column) {
      return sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />;
    }
    return <ArrowUpDown className="h-4 w-4" />;
  };

  // Format timestamp to readable date
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "—";
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex items-center space-x-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vocabulary..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-8"
            />
          </div>
        </div>
        
        {sources && sources.length > 0 && (
          <div className="flex items-center space-x-2 min-w-[200px]">
            <Select 
              value={selectedSource || "all-sources"} 
              onValueChange={handleSourceChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-sources">All Sources</SelectItem>
                {sources.map(source => (
                  <SelectItem key={source} value={source}>{source}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {selectedWords.length > 0 && (
        <div className="flex items-center justify-between bg-muted p-2 rounded-md">
          <div className="text-sm font-medium">
            {selectedWords.length} {selectedWords.length === 1 ? 'word' : 'words'} selected
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={openSourceUpdateDialog}
            >
              Update Source
            </Button>
          </div>
        </div>
      )}

      <div className="border rounded-md overflow-auto" style={{ width: 'auto', maxWidth: 'none' }}>
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox 
                  checked={isAllSelected} 
                  onCheckedChange={toggleSelectAll} 
                  aria-label="Select all words" 
                />
              </TableHead>
              <TableHead className="w-[60px] cursor-pointer" onClick={(e) => { e.preventDefault(); handleSort("approved"); }}>
                <div className="flex items-center gap-1">
                  Approved {getSortIcon("approved")}
                </div>
              </TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
              <TableHead 
                className="cursor-pointer" 
                onClick={(e) => { e.preventDefault(); handleSort("german"); }}
              >
                <div className="flex items-center gap-1">
                  German {getSortIcon("german")}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer" 
                onClick={(e) => { e.preventDefault(); handleSort("english"); }}
              >
                <div className="flex items-center gap-1">
                  English {getSortIcon("english")}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={(e) => { e.preventDefault(); handleSort("difficulty"); }}
              >
                <div className="flex items-center gap-1">
                  Difficulty {getSortIcon("difficulty")}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer" 
                onClick={(e) => { e.preventDefault(); handleSort("source"); }}
              >
                <div className="flex items-center gap-1">
                  Source {getSortIcon("source")}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer" 
                onClick={(e) => { e.preventDefault(); handleSort("createdAt"); }}
              >
                <div className="flex items-center gap-1">
                  Created {getSortIcon("createdAt")}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer" 
                onClick={(e) => { e.preventDefault(); handleSort("updatedAt"); }}
              >
                <div className="flex items-center gap-1">
                  Updated {getSortIcon("updatedAt")}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    <p>Loading vocabulary...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : words.length > 0 ? (
              words.map((word) => (
                <TableRow key={word.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedWords.includes(word.id)}
                      onCheckedChange={() => toggleWordSelection(word.id)}
                      aria-label={`Select ${word.german}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      checked={word.approved}
                      onCheckedChange={(checked) => 
                        handleApproveWordWithStateUpdate(word.id, checked === true)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {editingId === word.id ? (
                      <div className="flex space-x-2">
                        <Button size="sm" onClick={saveEdit}>Save</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        <Button size="icon" variant="ghost" onClick={() => startEditing(word)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => onDeleteWord(word.id)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[180px]">
                    {editingId === word.id ? (
                      <Input 
                        value={editGerman} 
                        onChange={(e) => setEditGerman(e.target.value)}
                      />
                    ) : (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="block truncate" title={word.german}>{word.german}</span>
                          </TooltipTrigger>
                          <TooltipContent>{word.german}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[180px]">
                    {editingId === word.id ? (
                      <Input 
                        value={editEnglish} 
                        onChange={(e) => setEditEnglish(e.target.value)}
                      />
                    ) : (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="block truncate" title={word.english}>{word.english}</span>
                          </TooltipTrigger>
                          <TooltipContent>{word.english}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </TableCell>
                  <TableCell>
                    {onUpdateDifficulty && (
                      <Select
                        value={word.difficulty?.toString() || "0"}
                        onValueChange={(value) => handleDifficultyChange(word.id, value)}
                        disabled={editingId === word.id}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Unknown</SelectItem>
                          <SelectItem value="1">Easy</SelectItem>
                          <SelectItem value="2">Medium</SelectItem>
                          <SelectItem value="3">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[150px]">
                    {word.source ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm truncate" title={word.source}>{word.source}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>{word.source}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(word.createdAt)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(word.updatedAt)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4 text-muted-foreground">
                  No vocabulary words found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, totalWords)} of {totalWords} words
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <div className="text-sm">
              Page {page} of {totalPages}
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={isSourceDialogOpen} onOpenChange={setIsSourceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Source</DialogTitle>
            <DialogDescription>
              Update the source for {selectedWords.length} selected {selectedWords.length === 1 ? 'word' : 'words'}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label htmlFor="new-source" className="text-sm font-medium">
                New source name
              </label>
              <Input
                id="new-source"
                value={newSource}
                onChange={(e) => setNewSource(e.target.value)}
                placeholder="Enter source name"
              />
            </div>
            {sources && sources.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Or select existing source:</p>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {sources.map((source) => (
                    <Button
                      key={source}
                      variant="outline"
                      size="sm"
                      className="justify-start"
                      onClick={() => setNewSource(source)}
                    >
                      {newSource === source && <Check className="mr-2 h-4 w-4" />}
                      {source}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSourceDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSource}>
              Update Source
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VocabularyList;
