
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VocabularyWord, getPaginatedVocabulary } from "@/utils/vocabularyService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Search, ChevronLeft, ChevronRight, SortAsc, SortDesc, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface VocabularyListProps {
  words?: VocabularyWord[];
  onApproveWord: (id: string, approved: boolean) => void;
  onDeleteWord: (id: string) => void;
  onEditWord: (id: string, german: string, english: string) => void;
  onUpdateDifficulty?: (id: string, difficulty: number) => void;
  onUpdateSource?: (ids: string[], newSource: string) => void;
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
  onUpdateSource,
  selectedSource,
  sources = [],
  onSourceChange
}: VocabularyListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editGerman, setEditGerman] = useState("");
  const [editEnglish, setEditEnglish] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalWords, setTotalWords] = useState(0);
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState<"german" | "english" | "updated">("german");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedWordIds, setSelectedWordIds] = useState<string[]>([]);
  const [isSourceDialogOpen, setIsSourceDialogOpen] = useState(false);
  const [newSource, setNewSource] = useState("");

  // Load words with pagination if propWords is not provided
  useEffect(() => {
    if (propWords) {
      // Apply sorting to the provided words
      const sortedWords = [...propWords].sort((a, b) => {
        if (sortField === "german") {
          return sortDirection === "asc" 
            ? a.german.localeCompare(b.german)
            : b.german.localeCompare(a.german);
        } else if (sortField === "english") {
          return sortDirection === "asc"
            ? a.english.localeCompare(b.english)
            : b.english.localeCompare(a.english);
        } else if (sortField === "updated") {
          // Compare by the updatedAt timestamp if it exists, otherwise use id (as a proxy for creation date)
          const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : parseInt(a.id);
          const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : parseInt(b.id);
          return sortDirection === "asc" ? aTime - bTime : bTime - aTime;
        }
        return 0;
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
        sortField,
        sortDirection
      );
      setWords(paginatedWords);
      setTotalWords(totalCount);
      setLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [page, pageSize, searchTerm, selectedSource, propWords, sortField, sortDirection]);

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

  // Toggle sort direction or change sort field
  const handleSort = (field: "german" | "english" | "updated") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setPage(1); // Reset to first page when changing sort
  };

  // Handle individual word selection
  const handleSelectWord = (id: string, selected: boolean) => {
    setSelectedWordIds(prevSelected => {
      if (selected) {
        return [...prevSelected, id];
      } else {
        return prevSelected.filter(wordId => wordId !== id);
      }
    });
  };

  // Handle select all words on current page
  const handleSelectAllOnPage = (selected: boolean) => {
    if (selected) {
      const currentPageIds = words.map(word => word.id);
      setSelectedWordIds(prev => {
        const uniqueIds = new Set([...prev, ...currentPageIds]);
        return Array.from(uniqueIds);
      });
    } else {
      const currentPageIds = new Set(words.map(word => word.id));
      setSelectedWordIds(prev => prev.filter(id => !currentPageIds.has(id)));
    }
  };

  // Check if all words on current page are selected
  const areAllWordsOnPageSelected = words.length > 0 && 
    words.every(word => selectedWordIds.includes(word.id));

  // Update source for selected words
  const handleUpdateSource = () => {
    if (selectedWordIds.length === 0 || !newSource.trim() || !onUpdateSource) return;
    
    onUpdateSource(selectedWordIds, newSource.trim());
    setIsSourceDialogOpen(false);
    setNewSource("");
    
    toast({
      title: "Source Updated",
      description: `Updated source for ${selectedWordIds.length} word(s) to "${newSource.trim()}"`,
    });
  };

  // Clear all selections
  const clearSelections = () => {
    setSelectedWordIds([]);
  };

  return (
    <div className="space-y-4">
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

      {/* Batch actions toolbar */}
      {selectedWordIds.length > 0 && (
        <div className="flex items-center justify-between bg-muted p-2 rounded-md">
          <div className="text-sm font-medium">
            {selectedWordIds.length} word{selectedWordIds.length === 1 ? '' : 's'} selected
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setIsSourceDialogOpen(true)}
            >
              Update Source
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={clearSelections}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox 
                  checked={areAllWordsOnPageSelected}
                  onCheckedChange={handleSelectAllOnPage}
                  aria-label="Select all words on page"
                />
              </TableHead>
              <TableHead className="w-[100px]">Approved</TableHead>
              <TableHead>
                <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleSort("german")}>
                  German
                  {sortField === "german" && (
                    sortDirection === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleSort("english")}>
                  English
                  {sortField === "english" && (
                    sortDirection === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>
                <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleSort("updated")}>
                  Updated
                  {sortField === "updated" && (
                    sortDirection === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
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
                      checked={selectedWordIds.includes(word.id)}
                      onCheckedChange={(checked) => handleSelectWord(word.id, checked === true)}
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
                      <Input 
                        value={editGerman} 
                        onChange={(e) => setEditGerman(e.target.value)}
                      />
                    ) : (
                      word.german
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === word.id ? (
                      <Input 
                        value={editEnglish} 
                        onChange={(e) => setEditEnglish(e.target.value)}
                      />
                    ) : (
                      word.english
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
                  <TableCell>
                    {word.source ? (
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{word.source}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">No source</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {word.updatedAt 
                        ? new Date(word.updatedAt).toLocaleDateString() 
                        : 'Not updated'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId === word.id ? (
                      <div className="flex justify-end space-x-2">
                        <Button size="sm" onClick={saveEdit}>Save</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end space-x-2">
                        <Button size="sm" variant="outline" onClick={() => startEditing(word)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => onDeleteWord(word.id)}>
                          Delete
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
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

      {/* Dialog for updating source */}
      <Dialog open={isSourceDialogOpen} onOpenChange={setIsSourceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Source</DialogTitle>
            <DialogDescription>
              Change the source for {selectedWordIds.length} selected word{selectedWordIds.length === 1 ? '' : 's'}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="newSource" className="text-sm font-medium">
                  New Source
                </label>
                <Input
                  id="newSource"
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  placeholder="Enter new source name"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSourceDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSource} disabled={!newSource.trim()}>
              Update Source
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VocabularyList;
