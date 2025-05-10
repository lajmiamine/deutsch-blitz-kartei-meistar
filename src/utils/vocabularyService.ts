
export interface VocabularyWord {
  id: string;
  german: string;
  english: string;
  approved: boolean;
  difficulty: number;  // 1-easy, 2-medium, 3-hard
  timesCorrect: number;
  timesIncorrect: number;
  source?: string;  // Optional field to track which file the word came from
}

const LOCAL_STORAGE_KEY = 'german_vocabulary';

// Sample vocabulary to start with
const sampleVocabulary: VocabularyWord[] = [
  { id: '1', german: 'Haus', english: 'house', approved: true, difficulty: 1, timesCorrect: 0, timesIncorrect: 0 },
  { id: '2', german: 'Katze', english: 'cat', approved: true, difficulty: 1, timesCorrect: 0, timesIncorrect: 0 },
  { id: '3', german: 'Hund', english: 'dog', approved: true, difficulty: 1, timesCorrect: 0, timesIncorrect: 0 },
  { id: '4', german: 'Buch', english: 'book', approved: true, difficulty: 1, timesCorrect: 0, timesIncorrect: 0 },
  { id: '5', german: 'Apfel', english: 'apple', approved: true, difficulty: 1, timesCorrect: 0, timesIncorrect: 0 },
  { id: '6', german: 'Fenster', english: 'window', approved: true, difficulty: 2, timesCorrect: 0, timesIncorrect: 0 },
  { id: '7', german: 'Straße', english: 'street', approved: true, difficulty: 2, timesCorrect: 0, timesIncorrect: 0 },
  { id: '8', german: 'Blume', english: 'flower', approved: true, difficulty: 1, timesCorrect: 0, timesIncorrect: 0 },
  { id: '9', german: 'Wasser', english: 'water', approved: true, difficulty: 1, timesCorrect: 0, timesIncorrect: 0 },
  { id: '10', german: 'Tisch', english: 'table', approved: true, difficulty: 1, timesCorrect: 0, timesIncorrect: 0 },
];

// Initialize localStorage with sample vocabulary if empty
const initializeVocabulary = (): void => {
  const existingVocabulary = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!existingVocabulary) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sampleVocabulary));
  }
};

// Get all vocabulary words
export const getVocabulary = (): VocabularyWord[] => {
  initializeVocabulary();
  const vocabularyString = localStorage.getItem(LOCAL_STORAGE_KEY);
  return vocabularyString ? JSON.parse(vocabularyString) : [];
};

// Get all approved vocabulary words
export const getApprovedVocabulary = (): VocabularyWord[] => {
  const vocabulary = getVocabulary();
  return vocabulary.filter(word => word.approved);
};

// Get paginated vocabulary
export const getPaginatedVocabulary = (
  page: number = 1, 
  pageSize: number = 20, 
  searchTerm: string = '',
  source?: string
): { words: VocabularyWord[], totalCount: number } => {
  const vocabulary = getVocabulary();
  
  // Filter by search term and source if provided
  const filtered = vocabulary.filter(word => {
    const matchesSearch = searchTerm === '' || 
      word.german.toLowerCase().includes(searchTerm.toLowerCase()) || 
      word.english.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesSource = !source || word.source === source;
    
    return matchesSearch && matchesSource;
  });
  
  const totalCount = filtered.length;
  const startIndex = (page - 1) * pageSize;
  const paginatedWords = filtered.slice(startIndex, startIndex + pageSize);
  
  return {
    words: paginatedWords,
    totalCount
  };
};

// Add a new vocabulary word
export const addVocabularyWord = (german: string, english: string, approved: boolean = false, source?: string): void => {
  const vocabulary = getVocabulary();
  const newWord: VocabularyWord = {
    id: Date.now().toString(),
    german,
    english,
    approved,
    difficulty: 1,
    timesCorrect: 0,
    timesIncorrect: 0,
    source
  };
  vocabulary.push(newWord);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(vocabulary));
};

// Update approval status of a word
export const updateWordApproval = (id: string, approved: boolean): void => {
  const vocabulary = getVocabulary();
  const updatedVocabulary = vocabulary.map(word => {
    if (word.id === id) {
      return { ...word, approved };
    }
    return word;
  });
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedVocabulary));
};

// Update a vocabulary word
export const updateVocabularyWord = (id: string, german: string, english: string): void => {
  const vocabulary = getVocabulary();
  const updatedVocabulary = vocabulary.map(word => {
    if (word.id === id) {
      return { ...word, german, english };
    }
    return word;
  });
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedVocabulary));
};

// Delete a vocabulary word
export const deleteVocabularyWord = (id: string): void => {
  const vocabulary = getVocabulary();
  const updatedVocabulary = vocabulary.filter(word => word.id !== id);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedVocabulary));
};

// Delete all vocabulary words from a specific source
export const deleteWordsBySource = (source: string): number => {
  const vocabulary = getVocabulary();
  const wordsBeforeDelete = vocabulary.length;
  const updatedVocabulary = vocabulary.filter(word => word.source !== source);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedVocabulary));
  
  // Return the number of words that were deleted
  return wordsBeforeDelete - updatedVocabulary.length;
};

// Add multiple vocabulary words (e.g., from text import)
export const addMultipleVocabularyWords = (words: Array<{ german: string; english: string }>, source?: string): void => {
  const vocabulary = getVocabulary();
  
  // Create a map of existing german-english pairs to prevent duplicates
  const existingPairs = new Map<string, boolean>();
  vocabulary.forEach(word => {
    const key = `${word.german.toLowerCase()}-${word.english.toLowerCase()}`;
    existingPairs.set(key, true);
  });
  
  // Filter out duplicates
  const uniqueNewWords = words.filter(word => {
    const key = `${word.german.toLowerCase()}-${word.english.toLowerCase()}`;
    return !existingPairs.has(key);
  });
  
  const newWords = uniqueNewWords.map(word => ({
    id: Date.now() + Math.random().toString(36).substring(2, 8),
    german: word.german,
    english: word.english,
    approved: true, // Changed to true - automatically approve imported words
    difficulty: 1,
    timesCorrect: 0,
    timesIncorrect: 0,
    source: source || undefined
  }));
  
  const updatedVocabulary = [...vocabulary, ...newWords];
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedVocabulary));
  
  return;
};

// Update word statistics after a flashcard attempt
export const updateWordStatistics = (id: string, wasCorrect: boolean): void => {
  const vocabulary = getVocabulary();
  const updatedVocabulary = vocabulary.map(word => {
    if (word.id === id) {
      const timesCorrect = wasCorrect ? word.timesCorrect + 1 : word.timesCorrect;
      const timesIncorrect = wasCorrect ? word.timesIncorrect : word.timesIncorrect + 1;
      
      // Adjust difficulty based on correct/incorrect ratio
      let newDifficulty = word.difficulty;
      const totalAttempts = timesCorrect + timesIncorrect;
      
      if (totalAttempts >= 3) {
        const correctRatio = timesCorrect / totalAttempts;
        if (correctRatio > 0.8) newDifficulty = 1; // Easy
        else if (correctRatio > 0.5) newDifficulty = 2; // Medium
        else newDifficulty = 3; // Hard
      }
      
      return { 
        ...word, 
        timesCorrect, 
        timesIncorrect, 
        difficulty: newDifficulty 
      };
    }
    return word;
  });
  
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedVocabulary));
};

// Get vocabulary words based on difficulty
export const getVocabularyByDifficulty = (difficulty: number): VocabularyWord[] => {
  const vocabulary = getApprovedVocabulary();
  return vocabulary.filter(word => word.difficulty === difficulty);
};

// Get all vocabulary words by source
export const getVocabularyBySource = (source: string): VocabularyWord[] => {
  const vocabulary = getVocabulary();
  return vocabulary.filter(word => word.source === source);
};

// Get approved vocabulary by source
export const getApprovedVocabularyBySource = (source: string): VocabularyWord[] => {
  const vocabulary = getApprovedVocabulary();
  return vocabulary.filter(word => word.source === source);
};

// Get all available sources
export const getAllSources = (): string[] => {
  const vocabulary = getVocabulary();
  const sources = vocabulary
    .map(word => word.source)
    .filter((value, index, self) => 
      value !== undefined && self.indexOf(value) === index
    ) as string[];
  
  return sources;
};

// Clear all vocabulary
export const clearVocabulary = (): void => {
  localStorage.removeItem(LOCAL_STORAGE_KEY);
};
