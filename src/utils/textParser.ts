
export interface ParsedWord {
  german: string;
  english: string;
}

// Text parser utility to extract vocabulary words from text files
export const extractVocabularyFromText = async (file: File): Promise<Array<ParsedWord>> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string || "";
        
        // Step 1: Extract all words 4 letters or longer
        const words = extractWords(text);
        
        // Step 2: For each word, get a translation
        const translatedWords = await translateWords(words);
        
        resolve(translatedWords);
      } catch (err) {
        reject(new Error("Failed to extract vocabulary from text file"));
      }
    };

    reader.onerror = () => {
      reject(new Error("Error reading the text file"));
    };

    reader.readAsText(file);
  });
};

// Helper function to extract words 4 letters or longer from text
const extractWords = (text: string): string[] => {
  // Split text into words, removing special characters except German umlauts
  const wordsArray = text.match(/[A-Za-zäöüÄÖÜß]{4,}/g) || [];
  
  // Filter out duplicates
  const uniqueWords = Array.from(new Set(wordsArray));
  
  // Filter out common German stopwords
  const stopwords = [
    "aber", "alle", "allem", "allen", "aller", "alles", "als", "auch", "auf",
    "aus", "bei", "bin", "bis", "bist", "das", "dem", "den", "der", "des", 
    "die", "doch", "dort", "durch", "eine", "einem", "einen", "einer", "eines",
    "einig", "einige", "einigem", "einigen", "einiger", "einiges", "erst", "etwa",
    "etwas", "für", "gegen", "gewesen", "hab", "habe", "haben", "hat", "hatte", 
    "hatten", "hier", "hin", "hinter", "ich", "ihr", "ihre", "ihrem", "ihren", 
    "ihrer", "ihres", "ihn", "ihnen", "ihm", "ist", "jede", "jedem", "jeden", 
    "jeder", "jedes", "jene", "jenem", "jenen", "jener", "jenes", "kann", "kein", 
    "keine", "keinem", "keinen", "keiner", "keines", "können", "könnte", "machen",
    "man", "manche", "manchem", "manchen", "mancher", "manches", "mein", "meine", 
    "meinem", "meinen", "meiner", "meines", "mich", "mir", "mit", "nach", "nicht", 
    "nichts", "noch", "nun", "nur", "oder", "ohne", "sehr", "sein", "seine", 
    "seinem", "seinen", "seiner", "seines", "selbst", "sich", "sie", "sind", 
    "solch", "solche", "solchem", "solchen", "solcher", "solches", "soll", 
    "sollte", "sondern", "sonst", "über", "und", "uns", "unser", "unsere", 
    "unserem", "unseren", "unserer", "unseres", "unter", "vom", "von", "vor", 
    "war", "waren", "warst", "was", "weg", "weil", "weiter", "welche", "welchem", 
    "welchen", "welcher", "welches", "wenn", "werde", "werden", "wie", "wieder", 
    "will", "wir", "wird", "wirst", "woher", "wohin", "wurde", "wurden", "würde",
    "würden", "zum", "zur"
  ];
  
  return uniqueWords.filter(word => 
    !stopwords.includes(word.toLowerCase()) &&
    isLikelyGerman(word)
  );
};

// Helper function to check if a word is likely German
const isLikelyGerman = (word: string): boolean => {
  // Words with German-specific characters are likely German
  if (/[äöüÄÖÜß]/.test(word)) {
    return true;
  }
  
  // Check for common German letter combinations
  const germanCombinations = ['sch', 'ch', 'ei', 'ie', 'ck', 'tz', 'eu', 'äu', 'qu'];
  for (const combo of germanCombinations) {
    if (word.toLowerCase().includes(combo)) {
      return true;
    }
  }
  
  // Check for common German endings
  const germanEndings = ['ung', 'heit', 'keit', 'chen', 'lein', 'lich', 'ig', 'isch'];
  for (const ending of germanEndings) {
    if (word.toLowerCase().endsWith(ending)) {
      return true;
    }
  }
  
  // Default to true for words that pass the 4+ letter filter
  // This is a simplified approach - in a real app, you'd want a more sophisticated check
  return true;
};

// Translation function
const translateWords = async (germanWords: string[]): Promise<ParsedWord[]> => {
  // In a real app, this would call a translation API like Google Translate, DeepL, etc.
  // For demonstration purposes, we'll use a dictionary for common words and a mock translation for others
  
  const translations: ParsedWord[] = [];
  
  // Dictionary of common German-English translations
  const dictionary: Record<string, string> = {
    // Common nouns
    "Haus": "house",
    "Tisch": "table",
    "Stuhl": "chair",
    "Buch": "book",
    "Auto": "car",
    "Stadt": "city",
    "Land": "country",
    "Wasser": "water",
    "Feuer": "fire",
    "Erde": "earth",
    "Luft": "air",
    "Baum": "tree",
    "Blume": "flower",
    "Tier": "animal",
    "Hund": "dog",
    "Katze": "cat",
    "Mann": "man",
    "Frau": "woman",
    "Kind": "child",
    "Freund": "friend",
    "Familie": "family",
    "Eltern": "parents",
    "Mutter": "mother",
    "Vater": "father",
    "Bruder": "brother",
    "Schwester": "sister",
    "Schule": "school",
    "Arbeit": "work",
    "Zeit": "time",
    "Jahr": "year",
    "Monat": "month",
    "Woche": "week",
    "Tag": "day",
    "Nacht": "night",
    "Morgen": "morning",
    "Abend": "evening",
    "Essen": "food",
    "Wein": "wine",
    "Bier": "beer",
    "Brot": "bread",
    "Obst": "fruit",
    "Gemüse": "vegetables",
    
    // Common verbs
    "gehen": "go",
    "kommen": "come",
    "machen": "make",
    "sehen": "see",
    "hören": "hear",
    "sprechen": "speak",
    "sagen": "say",
    "essen": "eat",
    "trinken": "drink",
    "schlafen": "sleep",
    "leben": "live",
    "lieben": "love",
    "denken": "think",
    "wissen": "know",
    "können": "can",
    "wollen": "want",
    "müssen": "must",
    "sollen": "should",
    "dürfen": "may",
    
    // Common adjectives
    "groß": "big",
    "klein": "small",
    "lang": "long",
    "kurz": "short",
    "hoch": "high",
    "tief": "deep",
    "breit": "wide",
    "schmal": "narrow",
    "dick": "thick",
    "dünn": "thin",
    "schwer": "heavy",
    "leicht": "light",
    "schnell": "fast",
    "langsam": "slow",
    "stark": "strong",
    "schwach": "weak",
    "reich": "rich",
    "arm": "poor",
    "jung": "young",
    "alt": "old",
    "neu": "new",
    "gut": "good",
    "schlecht": "bad",
    "schön": "beautiful",
    "hässlich": "ugly",
    "kalt": "cold",
    "warm": "warm",
    "heiß": "hot"
  };
  
  for (const germanWord of germanWords) {
    // Try case-insensitive lookup first
    const germanLower = germanWord.toLowerCase();
    
    // Check for direct match
    if (dictionary[germanWord]) {
      translations.push({
        german: germanWord,
        english: dictionary[germanWord]
      });
      continue;
    }
    
    // Check for case-insensitive match
    const matchKey = Object.keys(dictionary).find(
      key => key.toLowerCase() === germanLower
    );
    
    if (matchKey) {
      translations.push({
        german: germanWord,
        english: dictionary[matchKey]
      });
      continue;
    }
    
    // Generate a mock translation by changing the ending
    // This is just a demo - a real application would use a translation API
    let englishWord = germanLower;
    
    // Apply some simple transformation rules
    if (germanLower.endsWith("en")) {
      // Convert German verb infinitives: machen -> make, gehen -> go
      englishWord = germanLower.slice(0, -2);
    } else if (germanLower.endsWith("ung")) {
      // Convert -ung nouns: Hoffnung -> hope
      englishWord = germanLower.slice(0, -3) + "e";
    } else if (germanLower.endsWith("heit") || germanLower.endsWith("keit")) {
      // Convert abstract nouns: Schönheit -> beauty
      englishWord = germanLower.slice(0, -4) + "ness";
    } else if (germanLower.endsWith("lich")) {
      // Convert adjectives: freundlich -> friendly
      englishWord = germanLower.slice(0, -4) + "ly";
    }
    
    // Add to translations
    translations.push({
      german: germanWord,
      english: englishWord
    });
  }
  
  // In a real application, you would batch translate using an API
  // For example: const translations = await translateApi.translate(germanWords, 'de', 'en');
  
  return translations;
};
