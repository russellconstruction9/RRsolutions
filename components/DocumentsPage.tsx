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
    <div className="bg-white/90 backdrop-blur-xl p-8 sm:p-12 rounded-3xl shadow-premium border border-white/60 min-h-[80vh] flex flex-col relative overflow-hidden animate-slide-up">
      {/* Header decoration */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-500 via-accent-500 to-brand-500"></div>
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-brand-100/40 to-accent-100/40 rounded-full blur-2xl"></div>
      
      <div className="flex justify-between items-center mb-8 border-b border-slate-200/60 pb-6 flex-wrap gap-4 relative z-10">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Generated Project Documents</h2>
          <p className="text-slate-600 font-medium">Professional construction management suite</p>
        </div>
        <button
          onClick={onBack}
          className="group px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white font-semibold rounded-xl hover:from-slate-700 hover:to-slate-800 transition-all duration-300 flex items-center shadow-large hover:shadow-xl transform hover:scale-105"
          aria-label="Process another file"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 group-hover:-translate-x-1 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Process Another File
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8 flex-grow">
        <aside className="w-full md:w-1/4 lg:w-1/5 relative z-10">
          <nav className="flex flex-col space-y-2" role="tablist" aria-orientation="vertical">
            {documents.map((doc, index) => (
              <button
                key={index}
                id={`doc-tab-${index}`}
                role="tab"
                aria-selected={activeTabIndex === index}
                aria-controls={`doc-panel-${index}`}
                onClick={() => setActiveTabIndex(index)}
                className={`p-4 text-left font-semibold rounded-xl transition-all duration-300 text-sm shadow-soft hover:shadow-medium transform hover:scale-105 ${
                  activeTabIndex === index
                    ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-large'
                    : 'bg-slate-50/80 backdrop-blur-sm text-slate-700 hover:bg-slate-100/80 border border-slate-200/50'
                }`}
              >
                {doc.title}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 flex flex-col relative z-10">
          {activeDocument ? (
            <div 
              id={`doc-panel-${activeTabIndex}`}
              role="tabpanel"
              aria-labelledby={`doc-tab-${activeTabIndex}`}
              className="w-full h-full flex flex-col"
            >
              <div className="flex justify-between items-center mb-6 flex-wrap gap-y-4">
                  <h3 className="text-2xl font-bold text-slate-900">{activeDocument.title}</h3>
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className={`text-sm font-medium transition-all duration-500 px-3 py-1.5 rounded-full ${isSaved ? 'opacity-100 text-success-600 bg-success-50 border border-success-200' : 'opacity-0'}`}>
                      <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Changes saved
                    </span>
                     <button
                        onClick={handleGeneratePdf}
                        disabled={isGeneratingPdf}
                        className="group px-5 py-3 bg-gradient-to-r from-success-600 to-success-700 text-white font-semibold rounded-xl hover:from-success-700 hover:to-success-800 transition-all duration-300 flex items-center disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed shadow-large hover:shadow-xl transform hover:scale-105 disabled:hover:scale-100"
                        aria-label="Generate PDF document"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 group-hover:rotate-12 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
                           <path d="M4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H4zm0 1h8a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z"/>
                           <path d="M4.5 3A.5.5 0 0 1 5 2.5h3A.5.5 0 0 1 8.5 3v1A.5.5 0 0 1 8 4.5h-3A.5.5 0 0 1 4.5 4V3zm0 4A.5.5 0 0 1 5 6.5h6A.5.5 0 0 1 11.5 7v1A.5.5 0 0 1 11 8.5h-6A.5.5 0 0 1 4.5 8V7zM5 10.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5z"/>
                        </svg>
                        {isGeneratingPdf ? 'Generating...' : 'Generate PDF'}
                    </button>
                    <button
                        onClick={handleDownloadHtml}
                        className="group px-5 py-3 bg-gradient-to-r from-brand-600 to-brand-700 text-white font-semibold rounded-xl hover:from-brand-700 hover:to-brand-800 transition-all duration-300 flex items-center shadow-large hover:shadow-xl transform hover:scale-105"
                        aria-label="Download document as HTML"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 group-hover:translate-y-1 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
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
            <div className="flex items-center justify-center h-full text-slate-500">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-xl font-medium">No document selected</p>
                <p className="text-sm text-slate-400 mt-2">Choose a document from the sidebar to view</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default DocumentsPage;
