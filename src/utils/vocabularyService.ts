export interface VocabularyWord {
  id: string;
  german: string;
  english: string;
  approved: boolean;
  difficulty: number;  // 1-easy, 2-medium, 3-hard
  timesCorrect: number;
  timesIncorrect: number;
  source?: string;  // Optional field to track which file the word came from
  correctStreak?: number; // Track consecutive correct answers for mastery
  mastered?: boolean; // Whether the word is considered mastered
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
      
    // Consider "other" source to mean words without a source
    const matchesSource = !source || 
      (source === "other" ? !word.source : word.source === source);
    
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

// Check if a German word already exists in the vocabulary
export const germanWordExists = (germanWord: string): boolean => {
  const vocabulary = getVocabulary();
  return vocabulary.some(word => word.german.toLowerCase() === germanWord.toLowerCase());
};

// Get existing word by German term
export const getExistingWordByGerman = (germanWord: string): VocabularyWord | null => {
  const vocabulary = getVocabulary();
  const existingWord = vocabulary.find(word => 
    word.german.toLowerCase() === germanWord.toLowerCase()
  );
  return existingWord || null;
};

// Add a new vocabulary word
export const addVocabularyWord = (german: string, english: string, approved: boolean = false, source?: string, difficulty: number = 1): boolean => {
  // Check if the German word already exists
  if (germanWordExists(german)) {
    return false; // Word already exists, don't add it
  }
  
  const vocabulary = getVocabulary();
  const newWord: VocabularyWord = {
    id: Date.now().toString(),
    german,
    english,
    approved,
    difficulty,
    timesCorrect: 0,
    timesIncorrect: 0,
    source
  };
  vocabulary.push(newWord);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(vocabulary));
  return true; // Word was added successfully
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

// Update difficulty for all words from a specific source
export const updateDifficultyBySource = (source: string, newDifficulty: number): number => {
  const vocabulary = getVocabulary();
  let updatedCount = 0;
  
  const updatedVocabulary = vocabulary.map(word => {
    if (word.source === source) {
      updatedCount++;
      return { ...word, difficulty: newDifficulty };
    }
    return word;
  });
  
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedVocabulary));
  return updatedCount;
};

// Update a vocabulary word's difficulty
export const updateWordDifficulty = (id: string, difficulty: number): void => {
  const vocabulary = getVocabulary();
  const updatedVocabulary = vocabulary.map(word => {
    if (word.id === id) {
      return { ...word, difficulty };
    }
    return word;
  });
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedVocabulary));
};

// Update a vocabulary word
export const updateVocabularyWord = (id: string, german: string, english: string): boolean => {
  const vocabulary = getVocabulary();
  
  // Find the word being edited
  const editingWord = vocabulary.find(word => word.id === id);
  if (!editingWord) return false;
  
  // If the German word hasn't changed, or if it has changed but doesn't conflict with another word
  const germanChanged = editingWord.german.toLowerCase() !== german.toLowerCase();
  
  if (germanChanged) {
    // Check if the new German word already exists in another entry
    const germanExists = vocabulary.some(
      word => word.id !== id && word.german.toLowerCase() === german.toLowerCase()
    );
    
    if (germanExists) {
      return false; // Duplicate German word, don't update
    }
  }
  
  // Update the word
  const updatedVocabulary = vocabulary.map(word => {
    if (word.id === id) {
      return { ...word, german, english };
    }
    return word;
  });
  
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedVocabulary));
  return true;
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
export const addMultipleVocabularyWords = (words: Array<{ german: string; english: string; difficulty?: number }>, source?: string): { added: number, skipped: number } => {
  const vocabulary = getVocabulary();
  let addedCount = 0;
  let skippedCount = 0;
  
  // Create a map of existing German words for faster lookups
  const existingGermanWords = new Map<string, boolean>();
  vocabulary.forEach(word => {
    existingGermanWords.set(word.german.toLowerCase(), true);
  });
  
  // Filter out duplicates
  const newWords: VocabularyWord[] = [];
  
  words.forEach(word => {
    const germanLower = word.german.toLowerCase();
    
    // Skip if this German word already exists
    if (existingGermanWords.has(germanLower)) {
      skippedCount++;
      return;
    }
    
    // Add the word to our new words list
    newWords.push({
      id: Date.now() + Math.random().toString(36).substring(2, 8),
      german: word.german,
      english: word.english,
      approved: true, // Automatically approve imported words
      difficulty: word.difficulty || 1, // Use provided difficulty or default to 1 (Easy)
      timesCorrect: 0,
      timesIncorrect: 0,
      source: source || undefined
    });
    
    // Mark this German word as processed
    existingGermanWords.set(germanLower, true);
    addedCount++;
  });
  
  if (newWords.length > 0) {
    const updatedVocabulary = [...vocabulary, ...newWords];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedVocabulary));
  }
  
  return { added: addedCount, skipped: skippedCount };
};

// Update word statistics after a flashcard attempt
export const updateWordStatistics = (id: string, wasCorrect: boolean): VocabularyWord | null => {
  const vocabulary = getVocabulary();
  let updatedWord: VocabularyWord | null = null;
  
  const updatedVocabulary = vocabulary.map(word => {
    if (word.id === id) {
      const timesCorrect = wasCorrect ? word.timesCorrect + 1 : word.timesCorrect;
      const timesIncorrect = wasCorrect ? word.timesIncorrect : word.timesIncorrect + 1;
      
      // Track consecutive correct answers for mastery
      let correctStreak = word.correctStreak || 0;
      if (wasCorrect) {
        correctStreak += 1;
      } else {
        correctStreak = 0; // Reset streak on incorrect answer
      }
      
      // Determine mastery status
      // Mastery requires 2 consecutive correct answers
      // If they've had an incorrect answer, requires 3 consecutive correct answers
      let mastered = word.mastered || false;
      if (timesIncorrect > 0 && correctStreak >= 3) {
        mastered = true;
      } else if (timesIncorrect === 0 && correctStreak >= 2) {
        mastered = true;
      }
      
      updatedWord = { 
        ...word, 
        timesCorrect, 
        timesIncorrect,
        correctStreak,
        mastered
      };
      
      return updatedWord;
    }
    return word;
  });
  
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedVocabulary));
  return updatedWord;
};

// Reset mastery for all words
export const resetWordMasteryProgress = (): void => {
  const vocabulary = getVocabulary();
  const updatedVocabulary = vocabulary.map(word => {
    return { 
      ...word, 
      correctStreak: 0,
      mastered: false,
      // Reset the statistics as well
      timesCorrect: 0,
      timesIncorrect: 0
    };
  });
  
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedVocabulary));
};

// Get vocabulary words with mastery progress
export const getVocabularyWithProgress = (): VocabularyWord[] => {
  const vocabulary = getVocabulary();
  return vocabulary.map(word => {
    // Ensure mastery properties exist
    return {
      ...word,
      correctStreak: word.correctStreak || 0,
      mastered: word.mastered || false
    };
  });
};

// Get vocabulary words based on difficulty
export const getVocabularyByDifficulty = (difficulty: number): VocabularyWord[] => {
  const vocabulary = getApprovedVocabulary();
  return vocabulary.filter(word => word.difficulty === difficulty);
};

// Get all vocabulary words by source
export const getVocabularyBySource = (source: string): VocabularyWord[] => {
  const vocabulary = getVocabulary();
  // Handle "other" source to mean words without a source
  if (source === "other") {
    return vocabulary.filter(word => !word.source);
  }
  return vocabulary.filter(word => word.source === source);
};

// Get approved vocabulary by source
export const getApprovedVocabularyBySource = (source: string): VocabularyWord[] => {
  const vocabulary = getApprovedVocabulary();
  // Handle "other" source to mean words without a source
  if (source === "other") {
    return vocabulary.filter(word => !word.source);
  }
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

// Get word count per difficulty for a specific source
export const getWordCountByDifficulty = (source?: string): { easy: number, medium: number, hard: number } => {
  let words = getApprovedVocabulary();
  
  if (source) {
    if (source === "other") {
      // Get words without any source
      words = words.filter(word => !word.source);
    } else {
      // Get words from a specific source
      words = words.filter(word => word.source === source);
    }
  }
  
  return {
    easy: words.filter(word => word.difficulty === 1).length,
    medium: words.filter(word => word.difficulty === 2).length,
    hard: words.filter(word => word.difficulty === 3).length
  };
};

// Clear all vocabulary
export const clearVocabulary = (): void => {
  localStorage.removeItem(LOCAL_STORAGE_KEY);
};

// Add this function to support selecting individual words by ID
export const getWordsByIds = (ids: string[]): VocabularyWord[] => {
  const allWords = getApprovedVocabulary();
  return allWords.filter(word => ids.includes(word.id));
};

// Get non-mastered vocabulary words
export const getNonMasteredVocabulary = (): VocabularyWord[] => {
  const vocabulary = getApprovedVocabulary();
  return vocabulary.filter(word => !word.mastered);
};

// Get non-mastered vocabulary filtered by difficulty
export const getNonMasteredVocabularyByDifficulty = (difficulty: number): VocabularyWord[] => {
  const vocabulary = getApprovedVocabulary();
  return vocabulary.filter(word => word.difficulty === difficulty && !word.mastered);
};

// Update the source name for all words from a specific source
export const updateSourceName = (oldSource: string, newSource: string): number => {
  const vocabulary = getVocabulary();
  let updatedCount = 0;
  
  // Check if the new source name already exists
  const existingSources = getAllSources();
  if (existingSources.includes(newSource) && oldSource !== newSource) {
    return -1; // Return -1 to indicate the source name already exists
  }
  
  const updatedVocabulary = vocabulary.map(word => {
    if (word.source === oldSource) {
      updatedCount++;
      return { ...word, source: newSource };
    }
    return word;
  });
  
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedVocabulary));
  return updatedCount;
};

// Export vocabulary to JSON file
export const exportVocabulary = (): string => {
  const vocabulary = getVocabulary();
  const data = JSON.stringify(vocabulary, null, 2);
  return data;
};

// Import vocabulary from JSON file
export const importVocabulary = (jsonData: string): { success: boolean; wordCount: number } => {
  try {
    const vocabulary = JSON.parse(jsonData) as VocabularyWord[];
    
    // Validate the data structure
    const isValid = Array.isArray(vocabulary) && 
      vocabulary.every(word => 
        typeof word.id === 'string' &&
        typeof word.german === 'string' &&
        typeof word.english === 'string' &&
        typeof word.approved === 'boolean' &&
        typeof word.difficulty === 'number' &&
        typeof word.timesCorrect === 'number' &&
        typeof word.timesIncorrect === 'number'
      );
    
    if (!isValid) {
      return { success: false, wordCount: 0 };
    }
    
    // Save the imported vocabulary to localStorage
    localStorage.setItem(LOCAL_STORAGE_KEY, jsonData);
    
    return { success: true, wordCount: vocabulary.length };
  } catch (error) {
    console.error('Error importing vocabulary:', error);
    return { success: false, wordCount: 0 };
  }
};
