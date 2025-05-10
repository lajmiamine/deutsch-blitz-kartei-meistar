
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VocabularyWord } from "@/utils/vocabularyService";

interface VocabularyListProps {
  words: VocabularyWord[];
  onApproveWord: (id: string, approved: boolean) => void;
  onDeleteWord: (id: string) => void;
  onEditWord: (id: string, german: string, english: string) => void;
}

const VocabularyList = ({ words, onApproveWord, onDeleteWord, onEditWord }: VocabularyListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editGerman, setEditGerman] = useState("");
  const [editEnglish, setEditEnglish] = useState("");

  const filteredWords = words.filter(
    (word) =>
      word.german.toLowerCase().includes(searchTerm.toLowerCase()) ||
      word.english.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search vocabulary..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Approved</TableHead>
              <TableHead>German</TableHead>
              <TableHead>English</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredWords.length > 0 ? (
              filteredWords.map((word) => (
                <TableRow key={word.id}>
                  <TableCell>
                    <Checkbox
                      checked={word.approved}
                      onCheckedChange={(checked) => 
                        onApproveWord(word.id, checked === true)
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
                <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                  No vocabulary words found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default VocabularyList;
