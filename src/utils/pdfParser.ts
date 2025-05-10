
// Mock PDF parser since we can't use actual PDF parsing libraries in this sandbox
// In a real implementation, you'd use a library like pdf.js or pdfjs-dist

export const extractVocabularyFromPDF = async (file: File): Promise<Array<{ german: string; english: string }>> => {
  return new Promise((resolve, reject) => {
    // Simulate PDF processing delay
    setTimeout(() => {
      // In a real implementation, this would actually parse the PDF
      // For now, we'll return mock data based on the filename
      const filename = file.name.toLowerCase();
      
      // Mock extraction based on filename to simulate different PDF contents
      if (filename.includes('basic')) {
        resolve([
          { german: 'Schlüssel', english: 'key' },
          { german: 'Tür', english: 'door' },
          { german: 'Stuhl', english: 'chair' },
          { german: 'Lampe', english: 'lamp' },
          { german: 'Computer', english: 'computer' }
        ]);
      } else if (filename.includes('food')) {
        resolve([
          { german: 'Brot', english: 'bread' },
          { german: 'Käse', english: 'cheese' },
          { german: 'Wurst', english: 'sausage' },
          { german: 'Milch', english: 'milk' },
          { german: 'Ei', english: 'egg' }
        ]);
      } else if (filename.includes('travel')) {
        resolve([
          { german: 'Flugzeug', english: 'airplane' },
          { german: 'Bahnhof', english: 'train station' },
          { german: 'Reisepass', english: 'passport' },
          { german: 'Hotel', english: 'hotel' },
          { german: 'Strand', english: 'beach' }
        ]);
      } else {
        // Generic extraction for any other PDF
        resolve([
          { german: 'Freiheit', english: 'freedom' },
          { german: 'Wissenschaft', english: 'science' },
          { german: 'Kunst', english: 'art' },
          { german: 'Geschichte', english: 'history' },
          { german: 'Zukunft', english: 'future' }
        ]);
      }
    }, 1500);
  });
};
