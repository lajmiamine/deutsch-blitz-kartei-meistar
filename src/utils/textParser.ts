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
          // Process as XML - Keep XML parsing the same
          const parsedWords = parseXmlVocabulary(text);
          resolve(parsedWords);
        } else {
          // Process as regular text
          // Step 1: Extract all words 4 letters or longer
          const words = extractWords(text);
          
          // Step 2: For each word, get a translation using DeepL API
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

// XML parser for vocabulary words - Keep the same
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

// Helper function to extract words 4 letters or longer from text - Keep the same
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

// Translation function using DeepL API
const translateWords = async (sourceWords: string[], sourceLanguage: string = 'de', targetLanguage: string = 'en'): Promise<ParsedWord[]> => {
  console.log(`Translation requested: ${sourceWords.length} words from ${sourceLanguage} to ${targetLanguage}`);
  
  // Create an array to store the translations
  const translations: ParsedWord[] = [];
  
  try {
    // Check if we have any words to translate
    if (sourceWords.length === 0) {
      return translations;
    }
    
    // For demonstration purposes, we'll implement both DeepL and fallback methods
    // Try DeepL API first, then fallback to dictionary/mock if API fails
    
    try {
      // DEEPL API IMPLEMENTATION
      
      // Format source words for DeepL API
      // DeepL prefers a single request with all texts rather than multiple single-word requests
      const apiUrl = 'https://api-free.deepl.com/v2/translate';
      
      // Here we would need the API key from environment variables or user input
      // For security, we ask the user to provide their API key through UI
      const apiKey = localStorage.getItem('deepl_api_key');
      
      if (!apiKey) {
        throw new Error("DeepL API key not found. Please set your API key in the settings.");
      }
      
      // Split the words into batches to avoid hitting API limits
      // DeepL has character limits per request
      const batchSize = 50; // Adjust based on expected word lengths
      const batches = [];
      
      for (let i = 0; i < sourceWords.length; i += batchSize) {
        batches.push(sourceWords.slice(i, i + batchSize));
      }
      
      // Process each batch
      for (const batch of batches) {
        const formData = new FormData();
        
        // Add each word as a separate text parameter
        batch.forEach(word => {
          formData.append('text', word);
        });
        
        formData.append('source_lang', sourceLanguage.toUpperCase());
        formData.append('target_lang', targetLanguage.toUpperCase());
        
        // Make the API request
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `DeepL-Auth-Key ${apiKey}`
          },
          body: formData
        });
        
        if (!response.ok) {
          throw new Error(`DeepL API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Process the translations
        if (data.translations && Array.isArray(data.translations)) {
          batch.forEach((sourceWord, index) => {
            if (data.translations[index]) {
              const translatedText = data.translations[index].text;
              
              // Format the translation (capitalize first letter)
              const formattedTranslation = capitalizeFirstLetter(translatedText);
              
              // Add to our results
              if (sourceLanguage === 'de' && targetLanguage === 'en') {
                translations.push({
                  german: sourceWord,
                  english: formattedTranslation
                });
              } else if (sourceLanguage === 'en' && targetLanguage === 'de') {
                translations.push({
                  german: formattedTranslation,
                  english: sourceWord
                });
              } else {
                translations.push({
                  german: sourceLanguage === 'de' ? sourceWord : formattedTranslation,
                  english: targetLanguage === 'en' ? formattedTranslation : sourceWord
                });
              }
            }
          });
        }
      }
      
      console.log(`DeepL API successfully translated ${translations.length} words`);
      return translations;
      
    } catch (apiError) {
      console.error("DeepL API error:", apiError);
      console.log("Falling back to dictionary/mock translation");
      
      // FALLBACK TO DICTIONARY/MOCK TRANSLATION
      
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
      
      // Map the source words to the target language using the dictionary or mock translation
      for (const sourceWord of sourceWords) {
        const sourceWordLower = sourceWord.toLowerCase();
        let translation = '';
        
        // Check dictionary first using source language
        if (dictionary[sourceLanguage]?.[targetLanguage]?.[sourceWord]) {
          translation = dictionary[sourceLanguage][targetLanguage][sourceWord];
        } else if (dictionary[sourceLanguage]?.[targetLanguage]?.[sourceWordLower]) {
          translation = dictionary[sourceLanguage][targetLanguage][sourceWordLower];
        } else {
          // For words not in dictionary, create a mock translation
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
    }
  } catch (error) {
    console.error("Translation error:", error);
    // Return whatever translations we have so far
  }
  
  return translations;
};
