
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VocabularyWord, getPaginatedVocabulary } from "@/utils/vocabularyService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Search, ChevronLeft, ChevronRight } from "lucide-react";

interface VocabularyListProps {
  words?: VocabularyWord[];
  onApproveWord: (id: string, approved: boolean) => void;
  onDeleteWord: (id: string) => void;
  onEditWord: (id: string, german: string, english: string) => void;
  onUpdateDifficulty?: (id: string, difficulty: number) => void;
  selectedSource?: string;
  sources?: string[];
  onSourceChange?: (source: string | undefined) => void;
  isSelectable?: boolean;
  selectedWordIds?: string[];
  onWordSelect?: (id: string, selected: boolean) => void;
}

const VocabularyList = ({ 
  words: propWords, 
  onApproveWord, 
  onDeleteWord, 
  onEditWord,
  onUpdateDifficulty,
  selectedSource,
  sources = [],
  onSourceChange,
  isSelectable = false,
  selectedWordIds = [],
  onWordSelect
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

  // Load words with pagination if propWords is not provided
  useEffect(() => {
    if (propWords) {
      setWords(propWords);
      setTotalWords(propWords.length);
      return;
    }

    setLoading(true);
    
    // Use setTimeout to simulate API call and prevent UI freeze
    const timer = setTimeout(() => {
      const { words: paginatedWords, totalCount } = getPaginatedVocabulary(
        page,
        pageSize,
        searchTerm,
        selectedSource
      );
      setWords(paginatedWords);
      setTotalWords(totalCount);
      setLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [page, pageSize, searchTerm, selectedSource, propWords]);

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

  // Handle word selection for flashcard game
  const handleWordSelection = (id: string, selected: boolean) => {
    if (onWordSelect) {
      onWordSelect(id, selected);
    }
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

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              {isSelectable && <TableHead className="w-[60px]">Select</TableHead>}
              <TableHead className="w-[100px]">Approved</TableHead>
              <TableHead>German</TableHead>
              <TableHead>English</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Source</TableHead>
              {!isSelectable && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={isSelectable ? 6 : 6} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    <p>Loading vocabulary...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : words.length > 0 ? (
              words.map((word) => (
                <TableRow key={word.id}>
                  {isSelectable && (
                    <TableCell>
                      <Checkbox
                        checked={selectedWordIds.includes(word.id)}
                        onCheckedChange={(checked) => 
                          handleWordSelection(word.id, checked === true)
                        }
                      />
                    </TableCell>
                  )}
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
                    {word.source && (
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{word.source}</span>
                      </div>
                    )}
                  </TableCell>
                  {!isSelectable && (
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
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={isSelectable ? 6 : 6} className="text-center py-4 text-muted-foreground">
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
    </div>
  );
};

export default VocabularyList;
