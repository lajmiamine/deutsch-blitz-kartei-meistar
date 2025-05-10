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
        
        // Check if the file is an XML file by extension or content
        if (file.name.toLowerCase().endsWith('.xml') || text.trim().startsWith('<?xml') || text.trim().startsWith('<words>')) {
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

// Use ChatGPT API for translation
const translateWords = async (sourceWords: string[], sourceLanguage: string = 'de', targetLanguage: string = 'en'): Promise<ParsedWord[]> => {
  // Skip translation if no words to translate
  if (!sourceWords || sourceWords.length === 0) {
    return [];
  }
  
  console.log(`Translation requested: ${sourceWords.length} words from ${sourceLanguage} to ${targetLanguage}`);
  
  // Get the API key from localStorage
  const apiKey = localStorage.getItem('openai-api-key');
  
  const translations: ParsedWord[] = [];
  
  try {
    // If we have an API key, use the ChatGPT API
    if (apiKey) {
      // Batch all words to translate in a single API call for efficiency
      const translationResults = await translateWithChatGPT(sourceWords, sourceLanguage, targetLanguage, apiKey);
      
      if (translationResults && translationResults.length === sourceWords.length) {
        // Map the source words to their translations
        for (let i = 0; i < sourceWords.length; i++) {
          if (sourceLanguage === 'de' && targetLanguage === 'en') {
            translations.push({
              german: sourceWords[i],
              english: capitalizeFirstLetter(translationResults[i])
            });
          } else if (sourceLanguage === 'en' && targetLanguage === 'de') {
            translations.push({
              german: capitalizeFirstLetter(translationResults[i]),
              english: sourceWords[i]
            });
          } else {
            // For other language pairs
            translations.push({
              german: sourceLanguage === 'de' ? sourceWords[i] : capitalizeFirstLetter(translationResults[i]),
              english: targetLanguage === 'en' ? capitalizeFirstLetter(translationResults[i]) : sourceWords[i]
            });
          }
        }
        return translations;
      }
    }
    
    // Fallback to dictionary method if API key is missing or API call failed
    console.log("Using fallback dictionary translation method");
    return fallbackTranslation(sourceWords, sourceLanguage, targetLanguage);
  } catch (error) {
    console.error("Translation error:", error);
    // Fallback to dictionary method
    console.log("Using fallback dictionary translation after error");
    return fallbackTranslation(sourceWords, sourceLanguage, targetLanguage);
  }
};

// Helper function to translate with ChatGPT API
const translateWithChatGPT = async (
  words: string[], 
  sourceLanguage: string, 
  targetLanguage: string,
  apiKey: string
): Promise<string[]> => {
  // Prepare language names for clearer instructions
  const languageNames: Record<string, string> = {
    'de': 'German',
    'en': 'English',
    'fr': 'French',
    'es': 'Spanish',
    'it': 'Italian'
  };
  
  const sourceLangName = languageNames[sourceLanguage] || sourceLanguage;
  const targetLangName = languageNames[targetLanguage] || targetLanguage;
  
  // Create a prompt that asks for translation of all words at once
  const prompt = `Translate the following ${sourceLangName} words to ${targetLangName}. 
Return only the translations in a list format, one translation per line, in the same order as the input.
Do not include the original words, definitions, or any explanations.

${words.join('\n')}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Using GPT-4o for better translation quality
        messages: [
          {
            role: 'system',
            content: `You are a professional translator from ${sourceLangName} to ${targetLangName}. Provide accurate, concise translations.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3 // Lower temperature for more consistent translations
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OpenAI API Error: ${errorData}`);
    }

    const data = await response.json();
    const translationText = data.choices?.[0]?.message?.content;
    
    if (!translationText) {
      throw new Error("No translation content returned from API");
    }

    // Parse the response - should be one translation per line
    const translationLines = translationText
      .split('\n')
      .filter(line => line.trim() !== '');
    
    // Ensure we have the same number of translations as input words
    if (translationLines.length !== words.length) {
      console.warn(`Translation count mismatch: got ${translationLines.length}, expected ${words.length}`);
      
      // If we have more translations than words, trim the excess
      if (translationLines.length > words.length) {
        return translationLines.slice(0, words.length);
      }
      
      // If we have fewer translations, fill in with fallback translations
      const tempFallback = fallbackTranslation(words, sourceLanguage, targetLanguage);
      const missingWords = words.slice(translationLines.length);
      const missingTranslations = missingWords.map((word, idx) => {
        const fallbackIndex = words.indexOf(word);
        return tempFallback[fallbackIndex]?.english || `${word}-translated`;
      });
      
      return [...translationLines, ...missingTranslations];
    }
    
    return translationLines;
  } catch (error) {
    console.error("ChatGPT translation error:", error);
    throw error;
  }
};

// Fallback translation function using dictionary/mock translation
const fallbackTranslation = (sourceWords: string[], sourceLanguage: string = 'de', targetLanguage: string = 'en'): ParsedWord[] => {
  const translations: ParsedWord[] = [];
  
  // Mock translation - Dictionary of common translations
  const dictionary: Record<string, Record<string, Record<string, string>>> = {
    'de': {
      'en': {
        // Common nouns
        "Haus": "house",
        "Tisch": "table",
        "Stuhl": "chair",
        "Buch": "book",
        "Auto": "car",
        // ... keep existing code (common words in the dictionary)
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
      translations.push({
        german: sourceLanguage === 'de' ? sourceWord : translation,
        english: targetLanguage === 'en' ? translation : sourceWord
      });
    }
  }
  
  return translations;
};
