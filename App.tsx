
import React, { useState, useCallback } from 'react';
import PdfUploader from './components/PdfUploader';
import DocumentsPage from './components/DocumentsPage';
import Loader from './components/Loader';
import { processPdfAndGenerateReport } from './services/geminiService';
import { markdownToHtml } from './utils/markdownToHtml';

// Define the document structure
export interface Document {
  title: string;
  content: string; // Content will now be stored as an HTML string
}

// Updated parsing function to split the AI response and convert markdown to HTML
const parseAiResponse = (response: string): Document[] => {
  // Use a positive lookahead to split the string by section headers (e.g., "### Section 1" or "### Work Order") while keeping them
  const sections = response.split(/(?=### (?:Section \d+|Work Order):)/).filter(s => s.trim() !== '');

  if (sections.length === 0 && response.trim() !== '') {
      return [{ title: 'Generated Document', content: markdownToHtml(response) }];
  }

  return sections.map(section => {
    const lines = section.trim().split('\n');
    const titleLine = lines[0] || '';
    // A more robust way to capture the title, whether it's "Section X: Title" or "Work Order: Trade"
    const title = titleLine.replace(/### /, '').trim(); 
    const markdownContent = lines.slice(1).join('\n').trim();
    // Convert the markdown body of each section to HTML
    const htmlContent = markdownToHtml(markdownContent);
    return { title, content: htmlContent };
  });
};


const App: React.FC = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [view, setView] = useState<'uploader' | 'documents'>('uploader');
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (file: File | null) => {
    setPdfFile(file);
    if (view === 'documents') {
        setView('uploader');
    }
    setDocuments([]);
    setError(null);
  };

  const handleSubmit = useCallback(async () => {
    if (!pdfFile) {
      setError("Please select a PDF file to process.");
      return;
    }

    setIsLoading(true);
    setDocuments([]);
    setError(null);
    setView('uploader');

    try {
      const response = await processPdfAndGenerateReport(pdfFile);
      const parsedDocs = parseAiResponse(response);
      if (parsedDocs.length === 0) {
        throw new Error("Could not parse the AI response into document sections.");
      }
      setDocuments(parsedDocs);
      setView('documents'); 
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unknown error occurred. Please check the console.");
      setView('uploader');
    } finally {
      setIsLoading(false);
    }
  }, [pdfFile, view]);

  const handleBackToUploader = () => {
    setView('uploader');
    setPdfFile(null);
    setDocuments([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-brand-dark tracking-tight">Construction Project Document Generator</h1>
          <p className="mt-2 text-lg text-brand-gray">
            Upload an insurance claim estimate PDF to automatically generate a complete project management package.
          </p>
        </header>

        {view === 'documents' ? (
          <DocumentsPage initialDocuments={documents} onBack={handleBackToUploader} />
        ) : (
          <main className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-200">
            <PdfUploader 
              onFileChange={handleFileChange} 
              onSubmit={handleSubmit} 
              isLoading={isLoading}
              selectedFile={pdfFile}
            />

            {isLoading && <Loader />}

            {error && (
              <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                <h3 className="font-bold">Error</h3>
                <p>{error}</p>
              </div>
            )}
          </main>
        )}
        
        <footer className="text-center mt-8 text-gray-500 text-sm">
          <p>&copy; 2024 AI Construction Project Manager. All Rights Reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
