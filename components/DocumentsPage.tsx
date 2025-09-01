import React, { useState, useEffect } from 'react';
import RichTextEditor from './RichTextEditor';
import { generatePdfFromHtml } from '../services/geminiService';

interface Document {
  title: string;
  content: string; // Content is now HTML
}

interface DocumentsPageProps {
  initialDocuments: Document[];
  onBack: () => void;
}

const DocumentsPage: React.FC<DocumentsPageProps> = ({ initialDocuments, onBack }) => {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    if (!isSaved) {
      const timer = setTimeout(() => setIsSaved(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [isSaved]);

  const handleContentChange = (htmlContent: string) => {
    const newDocuments = [...documents];
    newDocuments[activeTabIndex].content = htmlContent;
    setDocuments(newDocuments);
    setIsSaved(false);
  };
  
  const handleDownloadHtml = () => {
    const activeDocument = documents[activeTabIndex];
    if (!activeDocument) return;

    const blob = new Blob([`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${activeDocument.title}</title>
        <style>
          body { font-family: sans-serif; line-height: 1.6; padding: 2em; }
          table { border-collapse: collapse; width: 100%; margin: 1em 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          h1, h2, h3 { color: #333; }
        </style>
      </head>
      <body>
        <h1>${activeDocument.title}</h1>
        ${activeDocument.content}
      </body>
      </html>
    `], { type: 'text/html' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${activeDocument.title.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGeneratePdf = async () => {
    const activeDocument = documents[activeTabIndex];
    if (!activeDocument) return;

    setIsGeneratingPdf(true);
    try {
        const base64Pdf = await generatePdfFromHtml(activeDocument.content, activeDocument.title);
        
        // Decode base64 and create a Blob
        const byteCharacters = atob(base64Pdf);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });

        // Trigger download
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${activeDocument.title.replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } catch (error) {
        console.error("Failed to generate PDF:", error);
        alert("Sorry, there was an error generating the PDF. Please check the console for details.");
    } finally {
        setIsGeneratingPdf(false);
    }
  };

  const activeDocument = documents[activeTabIndex];

  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-200 min-h-[75vh] flex flex-col">
      <div className="flex justify-between items-center mb-6 border-b pb-4 flex-wrap gap-4">
        <h2 className="text-2xl font-semibold text-brand-dark">Generated Project Documents</h2>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-600 text-white font-medium rounded-md hover:bg-gray-700 transition-colors flex items-center"
          aria-label="Process another file"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Process Another File
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8 flex-grow">
        <aside className="w-full md:w-1/4 lg:w-1/5">
          <nav className="flex flex-col space-y-2" role="tablist" aria-orientation="vertical">
            {documents.map((doc, index) => (
              <button
                key={index}
                id={`doc-tab-${index}`}
                role="tab"
                aria-selected={activeTabIndex === index}
                aria-controls={`doc-panel-${index}`}
                onClick={() => setActiveTabIndex(index)}
                className={`p-3 text-left font-medium rounded-md transition-all duration-200 text-sm ${
                  activeTabIndex === index
                    ? 'bg-brand-blue text-white shadow-md'
                    : 'bg-gray-100 text-brand-dark hover:bg-gray-200 hover:shadow-sm'
                }`}
              >
                {doc.title}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 flex flex-col">
          {activeDocument ? (
            <div 
              id={`doc-panel-${activeTabIndex}`}
              role="tabpanel"
              aria-labelledby={`doc-tab-${activeTabIndex}`}
              className="w-full h-full flex flex-col"
            >
              <div className="flex justify-between items-center mb-4 flex-wrap gap-y-2">
                  <h3 className="text-xl font-bold text-brand-dark">{activeDocument.title}</h3>
                  <div className="flex items-center gap-4">
                    <span className={`text-sm transition-opacity duration-500 ${isSaved ? 'opacity-100 text-gray-500' : 'opacity-0'}`}>
                      Changes saved
                    </span>
                     <button
                        onClick={handleGeneratePdf}
                        disabled={isGeneratingPdf}
                        className="px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors flex items-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                        aria-label="Generate PDF document"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                           <path d="M4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H4zm0 1h8a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z"/>
                           <path d="M4.5 3A.5.5 0 0 1 5 2.5h3A.5.5 0 0 1 8.5 3v1A.5.5 0 0 1 8 4.5h-3A.5.5 0 0 1 4.5 4V3zm0 4A.5.5 0 0 1 5 6.5h6A.5.5 0 0 1 11.5 7v1A.5.5 0 0 1 11 8.5h-6A.5.5 0 0 1 4.5 8V7zM5 10.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5z"/>
                        </svg>
                        {isGeneratingPdf ? 'Generating...' : 'Generate PDF'}
                    </button>
                    <button
                        onClick={handleDownloadHtml}
                        className="px-4 py-2 bg-brand-blue text-white font-medium rounded-md hover:bg-blue-700 transition-colors flex items-center"
                        aria-label="Download document as HTML"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Download HTML
                    </button>
                  </div>
              </div>
              <RichTextEditor
                  value={activeDocument.content}
                  onChange={handleContentChange}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>No document selected.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default DocumentsPage;
