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
  
  // Try to detect common patterns in the text that might indicate word pairs
  // This is a simplified approach - real PDF parsing would be more robust
  
  // Look for patterns like "word - translation" or "word : translation"
  const patterns = [
    /([A-Za-zäöüÄÖÜß]+)\s*[-:]\s*([A-Za-z]+)/g,
    /([A-Za-zäöüÄÖÜß]+)\s*=\s*([A-Za-z]+)/g
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
  
  // If we couldn't extract words using patterns, fallback to word lists based on the file content and name
  if (!foundMatches) {
    // Generate words based on the file content and filename
    const wordList = generateWordList(text, filenameHint);
    result.push(...wordList);
  }
  
  // If we still have no words, use the backup sample words
  if (result.length === 0) {
    result.push(...getBackupWords(filenameHint));
  }
  
  return result;
};

// Helper function to generate word pairs based on text content
const generateWordList = (text: string, filenameHint: string): Array<{ german: string; english: string }> => {
  const result: Array<{ german: string; english: string }> = [];
  
  // Extract unique words with German characters (simplified approach)
  const germanWords = [...new Set(
    text.match(/[A-Za-zäöüÄÖÜß]{3,}/g) || []
  )].slice(0, 15); // Limit to 15 words
  
  // Map German words to English translations based on common patterns or dictionaries
  // This is highly simplified - a real implementation would use a translation API or dictionary
  germanWords.forEach(word => {
    // Mock translation logic - in a real app, you'd use a dictionary or API
    const mockTranslation = mockTranslate(word);
    result.push({ german: word, english: mockTranslation });
  });
  
  return result;
};

// Mock translation function (in a real app, you'd use a dictionary or API)
const mockTranslate = (germanWord: string): string => {
  // This is just a simple mock - in reality you'd use a proper translation mechanism
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
    "Land": "country"
  };
  
  // Check if we have a translation for this word
  if (commonWords[germanWord]) {
    return commonWords[germanWord];
  }
  
  // Otherwise generate a mock translation
  return `${germanWord.toLowerCase()}-en`;
};

// Fallback word lists based on filename hints
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
