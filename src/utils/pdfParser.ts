// Mock PDF parser since we can't use actual PDF parsing libraries in this sandbox
// In a real implementation, you'd use a library like pdf.js or pdfjs-dist

export const extractVocabularyFromPDF = async (file: File): Promise<Array<{ german: string; english: string }>> => {
  return new Promise((resolve, reject) => {
    // Simulate PDF processing delay
    setTimeout(() => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          // In a real implementation, we would parse the PDF text content
          // Here we're "simulating" extraction by analyzing the file content
          const text = event.target?.result as string || "";
          const extractedWords = extractWordsFromText(text, file.name);
          resolve(extractedWords);
        } catch (err) {
          reject(new Error("Failed to extract vocabulary from PDF"));
        }
      };

      reader.onerror = () => {
        reject(new Error("Error reading the PDF file"));
      };

      // Read the file as text to simulate PDF text extraction
      // In a real implementation, we would use a PDF parsing library
      reader.readAsText(file);
    }, 800);
  });
};

// Helper function to extract word pairs from text
const extractWordsFromText = (text: string, filename: string): Array<{ german: string; english: string }> => {
  const result: Array<{ german: string; english: string }> = [];
  const filenameHint = filename.toLowerCase();
  
  // Improved approach for dialogue transcripts
  
  // First, try to find words that look German (containing German-specific characters)
  const germanWordRegex = /\b[A-Za-zäöüÄÖÜß]{3,}\b/g;
  const potentialGermanWords = [...new Set(text.match(germanWordRegex) || [])];
  
  // Filter out common stop words and non-German looking words
  const filteredWords = potentialGermanWords.filter(word => {
    // Skip words that look like English (no German-specific characters)
    const hasGermanCharacters = /[äöüÄÖÜß]/.test(word) || isLikelyGermanWord(word);
    // Skip very short words (less than 3 characters)
    const isLongEnough = word.length >= 3;
    // Skip very common words that might be in both languages
    const isNotCommonWord = !["der", "die", "das", "und", "ist", "ein", "eine", "zu", "in", "mit", "für", "auf", "ich", "du", "er", "sie", "es"].includes(word.toLowerCase());
    
    return hasGermanCharacters && isLongEnough && isNotCommonWord;
  });
  
  // First try to extract using patterns
  const patterns = [
    /([A-Za-zäöüÄÖÜß]+)\s*[-:]\s*([A-Za-z]+)/g,
    /([A-Za-zäöüÄÖÜß]+)\s*=\s*([A-Za-z]+)/g,
    // Add more patterns specifically for dialogue transcripts
    /\b([A-Za-zäöüÄÖÜß]{3,})\s*\(([A-Za-z\s]+)\)/g,  // Words with translations in parentheses
  ];
  
  let foundMatches = false;
  
  for (const pattern of patterns) {
    let match;
    // Reset pattern for each iteration
    pattern.lastIndex = 0;
    
    while ((match = pattern.exec(text)) !== null) {
      // We found what looks like word pairs
      const germanWord = match[1].trim();
      const englishWord = match[2].trim();
      
      if (germanWord && englishWord) {
        result.push({ german: germanWord, english: englishWord });
        foundMatches = true;
      }
    }
  }
  
  // If we couldn't extract enough words using patterns, use the filtered German words
  if (!foundMatches || result.length < 5) {
    // Take up to 20 likely German words
    const wordsToAdd = filteredWords.slice(0, 20);
    
    wordsToAdd.forEach(germanWord => {
      // Skip words already added
      if (!result.some(item => item.german === germanWord)) {
        const mockTranslation = mockTranslate(germanWord);
        result.push({ german: germanWord, english: mockTranslation });
      }
    });
    
    foundMatches = result.length > 0;
  }
  
  // If we still couldn't extract words, use dialogue-specific extraction
  if (!foundMatches || result.length < 5) {
    // Look for dialogue patterns - sentences with quotation marks
    const dialogueLines = text.match(/["'](.+?)["']/g) || [];
    
    // Extract words from dialogue lines
    const dialogueWords = new Set<string>();
    dialogueLines.forEach(line => {
      const words = line.match(/\b[A-Za-zäöüÄÖÜß]{3,}\b/g) || [];
      words.forEach(word => {
        if (isLikelyGermanWord(word)) {
          dialogueWords.add(word);
        }
      });
    });
    
    // Add dialogue words to result
    [...dialogueWords].slice(0, 15).forEach(germanWord => {
      // Skip words already added
      if (!result.some(item => item.german === germanWord)) {
        const mockTranslation = mockTranslate(germanWord);
        result.push({ german: germanWord, english: mockTranslation });
      }
    });
  }
  
  // If we still have no words, use the backup sample words
  if (result.length === 0) {
    result.push(...getBackupWords(filenameHint));
  }
  
  return result;
};

// Helper function to determine if a word is likely German
const isLikelyGermanWord = (word: string): boolean => {
  // Some heuristics for German words
  const lowercaseWord = word.toLowerCase();
  
  // Check for common German endings
  const germanEndings = ['ung', 'heit', 'keit', 'schaft', 'chen', 'lein', 'lich', 'bar', 'sam', 'haft'];
  if (germanEndings.some(ending => lowercaseWord.endsWith(ending))) {
    return true;
  }
  
  // Check for common German letter combinations
  const germanCombinations = ['sch', 'ch', 'ck', 'tz', 'ei', 'eu', 'äu'];
  if (germanCombinations.some(combo => lowercaseWord.includes(combo))) {
    return true;
  }
  
  return false;
};

// Mock translation function (in a real app, you'd use a dictionary or API)
const mockTranslate = (germanWord: string): string => {
  // Expanded German-English dictionary
  const commonWords: Record<string, string> = {
    "Haus": "house",
    "Katze": "cat",
    "Hund": "dog",
    "Buch": "book",
    "Apfel": "apple",
    "Tisch": "table",
    "Stuhl": "chair",
    "Fenster": "window",
    "Tür": "door",
    "Auto": "car",
    "Schule": "school",
    "Baum": "tree",
    "Frau": "woman",
    "Mann": "man",
    "Kind": "child",
    "Wasser": "water",
    "Brot": "bread",
    "Milch": "milk",
    "Stadt": "city",
    "Land": "country",
    "Straße": "street",
    "Haus": "house",
    "Zeit": "time",
    "Jahr": "year",
    "Tag": "day",
    "Nacht": "night",
    "Hand": "hand",
    "Kopf": "head",
    "Auge": "eye",
    "Ohr": "ear",
    "Mund": "mouth",
    "Nase": "nose",
    "Herz": "heart",
    "Freund": "friend",
    "Familie": "family",
    "Arbeit": "work",
    "Geld": "money",
    "Essen": "food",
    "Trinken": "drink",
    "Liebe": "love",
    "Musik": "music",
    "Film": "movie",
    "Buch": "book",
    "Spiel": "game",
    "Sport": "sport",
    "Ball": "ball",
    "Karte": "map",
    "Handy": "mobile phone",
    "Computer": "computer",
    "Internet": "internet",
    "Schön": "beautiful",
    "Gut": "good",
    "Schlecht": "bad",
    "Groß": "big",
    "Klein": "small",
    "Alt": "old",
    "Neu": "new",
    "Schnell": "fast",
    "Langsam": "slow",
    "Woche": "week",
    "Monat": "month"
  };
  
  // Check if we have a translation for this word
  if (commonWords[germanWord]) {
    return commonWords[germanWord];
  }
  
  // Check case-insensitive match
  const matchKey = Object.keys(commonWords).find(
    key => key.toLowerCase() === germanWord.toLowerCase()
  );
  
  if (matchKey) {
    return commonWords[matchKey];
  }
  
  // Otherwise generate a reasonable mock translation
  return `${germanWord}-en`;
};

// Fallback word lists based on filename hints - keep this as backup
const getBackupWords = (filenameHint: string): Array<{ german: string; english: string }> => {
  if (filenameHint.includes("basic")) {
    return [
      { german: "Schlüssel", english: "key" },
      { german: "Tür", english: "door" },
      { german: "Stuhl", english: "chair" },
      { german: "Lampe", english: "lamp" },
      { german: "Computer", english: "computer" },
      { german: "Telefon", english: "telephone" },
      { german: "Uhr", english: "clock" },
      { german: "Tasche", english: "bag" }
    ];
  } else if (filenameHint.includes("food")) {
    return [
      { german: "Brot", english: "bread" },
      { german: "Käse", english: "cheese" },
      { german: "Wurst", english: "sausage" },
      { german: "Milch", english: "milk" },
      { german: "Ei", english: "egg" },
      { german: "Apfel", english: "apple" },
      { german: "Kartoffel", english: "potato" },
      { german: "Wasser", english: "water" }
    ];
  } else if (filenameHint.includes("travel")) {
    return [
      { german: "Flugzeug", english: "airplane" },
      { german: "Bahnhof", english: "train station" },
      { german: "Reisepass", english: "passport" },
      { german: "Hotel", english: "hotel" },
      { german: "Strand", english: "beach" },
      { german: "Karte", english: "map" },
      { german: "Koffer", english: "suitcase" },
      { german: "Taxi", english: "taxi" }
    ];
  } else {
    // Generic extraction for any other PDF
    return [
      { german: "Freiheit", english: "freedom" },
      { german: "Wissenschaft", english: "science" },
      { german: "Kunst", english: "art" },
      { german: "Geschichte", english: "history" },
      { german: "Zukunft", english: "future" },
      { german: "Musik", english: "music" },
      { german: "Sprache", english: "language" },
      { german: "Zeit", english: "time" }
    ];
  }
};
