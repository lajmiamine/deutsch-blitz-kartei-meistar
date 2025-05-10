export interface ParsedWord {
  german: string;
  english: string;
  exists?: boolean;  // Flag to indicate if word already exists in database
  existingDifficulty?: number;  // If exists, what's the current difficulty
}

// Text parser utility to extract vocabulary words from text files
export const extractVocabularyFromText = async (file: File, sourceLanguage: string = 'de', targetLanguage: string = 'en'): Promise<Array<ParsedWord>> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string || "";
        
        // Check file type by extension or content
        if (file.name.toLowerCase().endsWith('.json') || text.trim().startsWith('{')) {
          // Process as JSON
          const parsedWords = parseJsonVocabulary(text);
          resolve(parsedWords);
        } else if (file.name.toLowerCase().endsWith('.xml') || text.trim().startsWith('<?xml') || text.trim().startsWith('<words>')) {
          // Process as XML
          const parsedWords = parseXmlVocabulary(text);
          resolve(parsedWords);
        } else {
          // Process as regular text
          // Step 1: Extract all words 4 letters or longer
          const words = extractWords(text);
          
          // Step 2: For each word, get a translation
          const translatedWords = await translateWords(words, sourceLanguage, targetLanguage);
          
          resolve(translatedWords);
        }
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

/**
 * Capitalize the first letter of a string and make the rest lowercase
 * Example: "APPLE PIE" becomes "Apple pie"
 */
const capitalizeFirstLetter = (str: string): string => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Parse JSON vocabulary format
const parseJsonVocabulary = (jsonContent: string): Array<ParsedWord> => {
  const parsedWords: ParsedWord[] = [];
  
  try {
    // Parse JSON content
    const jsonData = JSON.parse(jsonContent);
    
    // Handle standard format where words are in a "words" array
    if (jsonData.words && Array.isArray(jsonData.words)) {
      jsonData.words.forEach((wordPair: any) => {
        if (wordPair.german && wordPair.english) {
          // Capitalize first letter of English translation
          const formattedEnglish = capitalizeFirstLetter(wordPair.english);
          
          parsedWords.push({
            german: wordPair.german,
            english: formattedEnglish
          });
        }
      });
    } 
    // Alternative format: direct array of word pairs
    else if (Array.isArray(jsonData)) {
      jsonData.forEach((wordPair: any) => {
        if (wordPair.german && wordPair.english) {
          // Capitalize first letter of English translation
          const formattedEnglish = capitalizeFirstLetter(wordPair.english);
          
          parsedWords.push({
            german: wordPair.german,
            english: formattedEnglish
          });
        }
      });
    }
    
    console.log(`Parsed ${parsedWords.length} words from JSON`);
  } catch (error) {
    console.error("Error parsing JSON:", error);
  }
  
  return parsedWords;
};

// XML parser for vocabulary words
const parseXmlVocabulary = (xmlContent: string): Array<ParsedWord> => {
  const parsedWords: ParsedWord[] = [];
  
  try {
    // Simple XML parsing without using a DOM parser
    // Look for <word> tags
    const wordRegex = /<word>([\s\S]*?)<\/word>/g;
    let wordMatch;
    
    while ((wordMatch = wordRegex.exec(xmlContent)) !== null) {
      const wordContent = wordMatch[1];
      
      // Extract German word (jp tag in the example)
      const germanMatch = /<jp>(.*?)<\/jp>/i.exec(wordContent);
      
      // Extract English word (eng tag in the example)
      const englishMatch = /<eng>(.*?)<\/eng>/i.exec(wordContent);
      
      if (germanMatch && englishMatch) {
        const german = germanMatch[1].trim();
        const english = englishMatch[1].trim();
        
        if (german && english) {
          // Capitalize first letter of the English translation
          const formattedEnglish = capitalizeFirstLetter(english);
          
          parsedWords.push({
            german,
            english: formattedEnglish
          });
        }
      }
    }
    
    console.log(`Parsed ${parsedWords.length} words from XML`);
  } catch (error) {
    console.error("Error parsing XML:", error);
  }
  
  return parsedWords;
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
    !stopwords.includes(word.toLowerCase())
  );
};

// Translation function using mock/dictionary for demo
// In a real app, this would use a translation API like Google Translate or DeepL
const translateWords = async (sourceWords: string[], sourceLanguage: string = 'de', targetLanguage: string = 'en'): Promise<ParsedWord[]> => {
  // In a real app, this would call a translation API
  
  // Adding translationKey as a proxy for what would be a real API key
  // This would normally be stored securely in an environment variable
  const translationKey = 'mock-translation-api-key';
  
  console.log(`Translation requested: ${sourceWords.length} words from ${sourceLanguage} to ${targetLanguage}`);
  
  // This is where we would make an API call in a real application
  // For demonstration, we'll use a dictionary for common DE-EN translations
  
  // Mock translation - Dictionary of common translations
  // Fix: Properly define the nested dictionary type
  const dictionary: Record<string, Record<string, Record<string, string>>> = {
    'de': {
      'en': {
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
        "Gemüse": "vegetables"
      },
      'fr': {
        "Haus": "maison",
        "Tisch": "table",
        "Stuhl": "chaise",
        "Buch": "livre",
        "Auto": "voiture"
      }
    },
    'en': {
      'de': {
        "house": "Haus",
        "table": "Tisch",
        "chair": "Stuhl",
        "book": "Buch",
        "car": "Auto"
      },
      'fr': {
        "house": "maison",
        "table": "table",
        "chair": "chaise",
        "book": "livre",
        "car": "voiture"
      }
    }
    // Add more language combinations as needed
  };
  
  // In a real implementation, handle the case when we have API problems
  // by returning partial results, error messages, etc.
  
  const translations: ParsedWord[] = [];

  try {
    // The actual API call would happen here, something like:
    // const translationResponse = await fetch('https://translation-api.com/translate', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${translationKey}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     q: sourceWords,
    //     source: sourceLanguage,
    //     target: targetLanguage,
    //     format: 'text'
    //   })
    // }).then(res => res.json());
    
    // Map the source words to the target language
    for (const sourceWord of sourceWords) {
      const sourceWordLower = sourceWord.toLowerCase();
      let translation = '';
      
      // Check dictionary first using source language
      if (dictionary[sourceLanguage]?.[targetLanguage]?.[sourceWord]) {
        translation = dictionary[sourceLanguage][targetLanguage][sourceWord];
      } else if (dictionary[sourceLanguage]?.[targetLanguage]?.[sourceWordLower]) {
        translation = dictionary[sourceLanguage][targetLanguage][sourceWordLower];
      } else {
        // For demo purposes, create a mock translation
        // In a real app, the actual translation would come from the API
        
        // Simple mock algorithm to show that we're "translating"
        if (sourceLanguage === 'de' && targetLanguage === 'en') {
          // German to English mock translation
          translation = sourceWord
            .replace(/sch/g, 'sh')
            .replace(/ei/g, 'i')
            .replace(/eu/g, 'oi')
            .replace(/ch/g, 'ch')
            .replace(/ä/g, 'ae')
            .replace(/ö/g, 'oe')
            .replace(/ü/g, 'ue')
            .replace(/ß/g, 'ss');
            
          // Add '-en' to the end of some words to make them feel "more English"
          if (Math.random() > 0.7) {
            translation += 'en';
          }
        } else if (sourceLanguage === 'en' && targetLanguage === 'de') {
          // English to German mock translation
          translation = sourceWord
            .replace(/sh/g, 'sch')
            .replace(/th/g, 't')
            .replace(/w/g, 'v')
            .replace(/i/g, 'ie')
            .replace(/y$/, 'ie');
            
          // Occasionally add typical German word endings
          if (Math.random() > 0.7) {
            translation += 'en';
          } else if (Math.random() > 0.5) {
            translation += 'ung';
          }
        } else {
          // Generic "translation" - just add a language-specific prefix
          const prefixes: Record<string, string> = {
            'de': 'de-',
            'en': 'en-',
            'fr': 'fr-',
            'es': 'es-',
            'it': 'it-'
          };
          translation = (prefixes[targetLanguage] || '') + sourceWord;
        }
      }
      
      // Capitalize the first letter of the translation
      translation = capitalizeFirstLetter(translation);
      
      // Output the pair
      if (sourceLanguage === 'de' && targetLanguage === 'en') {
        translations.push({
          german: sourceWord,
          english: translation 
        });
      } else if (sourceLanguage === 'en' && targetLanguage === 'de') {
        translations.push({
          german: translation,
          english: sourceWord
        });
      } else {
        // For other language pairs, we still need to map to our data model
        // This is a simplification; in a real app, you might want to store
        // the actual source language and target language separately
        translations.push({
          german: sourceLanguage === 'de' ? sourceWord : translation,
          english: targetLanguage === 'en' ? translation : sourceWord
        });
      }
    }
  } catch (error) {
    console.error("Translation error:", error);
    // In a real app, you might want to handle the error more gracefully
    // For now, we'll just return what we have
  }
  
  return translations;
};
