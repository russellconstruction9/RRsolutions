
import React, { useState, useCallback } from 'react';
import PdfUploader from './components/PdfUploader';
import DocumentsPage from './components/DocumentsPage';
import Loader from './components/Loader';
import { processPdfAndGenerateReport } from './services/geminiService';

// Define the document structure
export interface Document {
  title: string;
  content: string; // Content will now be stored as an HTML string
}

const formatCurrency = (num: number | undefined) => {
    if (num === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
}

// Updated parsing function to transform the AI's JSON response into HTML documents
const parseAiResponse = (jsonString: string): Document[] => {
    const data = JSON.parse(jsonString);
    const documents: Document[] = [];

    // 1. Scope of Work
    if (data.scopeOfWork) {
        let content = `
            <p><strong>Client:</strong> ${data.scopeOfWork.clientName || 'N/A'}</p>
            <p><strong>Address:</strong> ${data.scopeOfWork.projectAddress || 'N/A'}</p>
            <p><strong>Claim #:</strong> ${data.scopeOfWork.claimNumber || 'N/A'}</p>
            <h2>Overall Project Summary</h2>
            <p>${data.scopeOfWork.overallSummary || ''}</p>
        `;
        data.scopeOfWork.breakdown?.forEach((area: any) => {
            content += `<h3>${area.area}</h3>`;
            if (area.demolitionTasks?.length) {
                content += `<h4>Demolition</h4><ul>${area.demolitionTasks.map((t: string) => `<li>${t}</li>`).join('')}</ul>`;
            }
            if (area.restorationTasks?.length) {
                content += `<h4>Restoration</h4><ul>${area.restorationTasks.map((t: string) => `<li>${t}</li>`).join('')}</ul>`;
            }
        });
        documents.push({ title: 'Section 1: Project Scope of Work', content });
    }

    // 2. Project Budget
    if (data.projectBudget) {
        let content = `<p>${data.projectBudget.budgetSourceInfo || ''}</p>`;
        content += `
            <table border="1" style="width:100%; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left; background-color: #f2f2f2;">Category/Task</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left; background-color: #f2f2f2;">Description</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left; background-color: #f2f2f2;">Material Budget (RCV)</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left; background-color: #f2f2f2;">Labor Budget (RCV)</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left; background-color: #f2f2f2;">Total Budget (RCV)</th>
                    </tr>
                </thead>
                <tbody>
        `;
        data.projectBudget.lineItems?.forEach((item: any) => {
            content += `
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">${item.category || ''}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${item.description || ''}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${formatCurrency(item.materialBudget)}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${formatCurrency(item.laborBudget)}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${formatCurrency(item.totalBudget)}</td>
                </tr>
            `;
        });
        content += `
                    <tr><td colspan="4" style="padding: 8px; border: 1px solid #ddd; text-align:right;"><strong>Subtotal (Line Items)</strong></td><td style="padding: 8px; border: 1px solid #ddd;"><strong>${formatCurrency(data.projectBudget.subtotal)}</strong></td></tr>
                    <tr><td colspan="4" style="padding: 8px; border: 1px solid #ddd; text-align:right;"><strong>Material Sales Tax</strong></td><td style="padding: 8px; border: 1px solid #ddd;"><strong>${formatCurrency(data.projectBudget.salesTax)}</strong></td></tr>
                    <tr><td colspan="4" style="padding: 8px; border: 1px solid #ddd; text-align:right;"><strong>Overhead & Profit</strong></td><td style="padding: 8px; border: 1px solid #ddd;"><strong>${formatCurrency(data.projectBudget.overheadAndProfit)}</strong></td></tr>
                    <tr><td colspan="4" style="padding: 8px; border: 1px solid #ddd; text-align:right;"><strong>TOTAL PROJECT BUDGET</strong></td><td style="padding: 8px; border: 1px solid #ddd;"><strong>${formatCurrency(data.projectBudget.totalProjectBudget)}</strong></td></tr>
                </tbody>
            </table>
        `;
        documents.push({ title: 'Section 2: Project Budget', content });
    }

    // 3. Work Orders
    data.workOrders?.forEach((order: any) => {
        let content = `
            <p><strong>BUDGET (RCV):</strong> ${formatCurrency(order.budget)}</p>
            <p><strong>KEY MATERIALS & QUANTITIES:</strong> ${order.keyMaterials || 'N/A'}</p>
            <h3>INSTRUCTIONS:</h3>
            <ol>${order.instructions?.map((i: string) => `<li>${i}</li>`).join('') || ''}</ol>
        `;
        documents.push({ title: `Work Order: ${order.trade}`, content });
    });

    // 4. Selection Schedule
    if (data.selectionSchedule) {
        let content = `<p>${data.selectionSchedule.introductoryNote || ''}</p>`;
        content += `
            <table border="1" style="width:100%; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left; background-color: #f2f2f2;">Selection Item</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left; background-color: #f2f2f2;">Location(s)</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left; background-color: #f2f2f2;">Total Quantity</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left; background-color: #f2f2f2;">Material Allowance (per Unit)</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left; background-color: #f2f2f2;">Total Material Budget (RCV)</th>
                    </tr>
                </thead>
                <tbody>
        `;
        data.selectionSchedule.items?.forEach((item: any) => {
            content += `
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">${item.item || ''}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${item.locations || ''}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${item.quantity || ''}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${formatCurrency(item.allowancePerUnit)}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${formatCurrency(item.totalMaterialBudget)}</td>
                </tr>
            `;
        });
        content += `</tbody></table>`;
        documents.push({ title: 'Section 4: Customer Selection Schedule', content });
    }

    if (documents.length === 0) {
        return [{ title: 'Generated Document', content: `<p>The AI returned an unexpected response. Please see the raw data below:</p><pre>${JSON.stringify(data, null, 2)}</pre>` }];
    }

    return documents;
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
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-white to-primary-50 flex flex-col">
      {/* Navigation Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-secondary-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-medium">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-secondary-900">DocuGen Pro</h1>
                <p className="text-xs text-secondary-500 font-medium">Construction Intelligence</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 text-sm text-secondary-600">
                <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse-soft"></div>
                <span className="font-medium">AI Powered</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-6xl mx-auto">
          {/* Hero Section */}
          <header className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center px-4 py-2 bg-primary-50 border border-primary-200 rounded-full text-primary-700 text-sm font-medium mb-6">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Powered by Advanced AI Technology
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-secondary-900 tracking-tight mb-6">
              Transform Insurance Claims into
              <span className="block bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 bg-clip-text text-transparent">
                Professional Documents
              </span>
            </h1>
            <p className="mt-6 text-xl text-secondary-600 max-w-3xl mx-auto leading-relaxed">
              Upload your insurance claim estimate PDF and watch our AI instantly generate a complete project management suite—scope of work, budgets, work orders, and selection schedules.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-secondary-500">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-success-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Instant Processing
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-success-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Professional Output
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-success-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Editable Results
              </div>
            </div>
          </p>
        </header>

        {view === 'documents' ? (
          <DocumentsPage initialDocuments={documents} onBack={handleBackToUploader} />
        ) : (
          <main className="bg-white/70 backdrop-blur-sm p-8 sm:p-12 rounded-3xl shadow-strong border border-white/50 max-w-4xl mx-auto animate-slide-up">
            <PdfUploader 
              onFileChange={handleFileChange} 
              onSubmit={handleSubmit} 
              isLoading={isLoading}
              selectedFile={pdfFile}
            />

            {isLoading && <Loader />}

            {error && (
              <div className="mt-8 p-6 bg-error-50 border border-error-200 text-error-800 rounded-2xl shadow-soft">
                <div className="flex items-start">
                  <svg className="w-6 h-6 text-error-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Processing Error</h3>
                    <p className="text-error-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </main>
        )}
        
        <footer className="text-center mt-16 text-secondary-400 text-sm">
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6">
            <p>&copy; 2024 DocuGen Pro. All Rights Reserved.</p>
            <div className="flex items-center space-x-4">
              <span className="w-1 h-1 bg-secondary-300 rounded-full hidden sm:block"></span>
              <span>Powered by Advanced AI</span>
              <span className="w-1 h-1 bg-secondary-300 rounded-full hidden sm:block"></span>
              <span>Enterprise Ready</span>
            </div>
          </div>
        </footer>
        </div>
      </div>
    </div>
  );
};

export default App;
