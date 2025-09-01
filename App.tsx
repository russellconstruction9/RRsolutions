
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-50/30 flex flex-col relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-brand-400/20 to-accent-400/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-brand-500/10 to-accent-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }}></div>
      </div>
      
      {/* Navigation Header */}
      <nav className="bg-white/90 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50 shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl flex items-center justify-center shadow-large animate-glow">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">DocuGen Pro</h1>
                <p className="text-xs text-slate-500 font-medium tracking-wide">AI Construction Intelligence</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-3">
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-success-50 border border-success-200 rounded-full">
                  <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse-soft"></div>
                  <span className="text-sm font-medium text-success-700">AI Powered</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-7xl mx-auto relative z-10">
          {/* Hero Section */}
          <header className="text-center mb-16 animate-fade-in">
            <div className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-brand-50 to-accent-50 border border-brand-200/50 rounded-full text-brand-700 text-sm font-semibold mb-8 shadow-soft hover:shadow-medium transition-all duration-300">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="bg-gradient-to-r from-brand-600 to-accent-600 bg-clip-text text-transparent">Powered by Advanced AI Technology</span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 tracking-tight mb-8 leading-tight">
              Transform Insurance Claims into
              <span className="block bg-gradient-to-r from-brand-600 via-brand-500 to-accent-500 bg-clip-text text-transparent mt-2">
                Professional Documents
              </span>
            </h1>
            <p className="mt-8 text-xl sm:text-2xl text-slate-600 max-w-4xl mx-auto leading-relaxed font-light">
              Upload your insurance claim estimate PDF and watch our <span className="font-semibold text-brand-600">advanced AI</span> instantly generate a complete project management suite—scope of work, budgets, work orders, and selection schedules.
            </p>
            <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm">
              <div className="flex items-center bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-soft border border-slate-200/50">
                <svg className="w-5 h-5 text-success-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium text-slate-700">Instant Processing</span>
              </div>
              <div className="flex items-center bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-soft border border-slate-200/50">
                <svg className="w-5 h-5 text-success-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium text-slate-700">Professional Output</span>
              </div>
              <div className="flex items-center bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-soft border border-slate-200/50">
                <svg className="w-5 h-5 text-success-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium text-slate-700">Editable Results</span>
              </div>
            </div>
          </header>

        {view === 'documents' ? (
          <DocumentsPage initialDocuments={documents} onBack={handleBackToUploader} />
        ) : (
          <main className="bg-white/80 backdrop-blur-xl p-10 sm:p-16 rounded-3xl shadow-premium border border-white/60 max-w-5xl mx-auto animate-slide-up relative overflow-hidden">
            {/* Card decoration */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500 via-accent-500 to-brand-500"></div>
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-brand-100/50 to-accent-100/50 rounded-full blur-2xl"></div>
            
            <PdfUploader 
              onFileChange={handleFileChange} 
              onSubmit={handleSubmit} 
              isLoading={isLoading}
              selectedFile={pdfFile}
            />

            {isLoading && <Loader />}

            {error && (
              <div className="mt-10 p-8 bg-gradient-to-r from-error-50 to-error-50/80 border border-error-200/60 text-error-800 rounded-2xl shadow-large backdrop-blur-sm">
                <div className="flex items-start">
                  <svg className="w-7 h-7 text-error-500 mr-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="font-bold text-xl mb-3 text-error-900">Processing Error</h3>
                    <p className="text-error-700 leading-relaxed">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </main>
        )}
        
        <footer className="text-center mt-20 text-slate-400 text-sm relative z-10">
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-8">
            <p className="font-medium">&copy; 2024 DocuGen Pro. All Rights Reserved.</p>
            <div className="flex items-center space-x-4">
              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full hidden sm:block"></span>
              <span className="font-medium">Powered by Advanced AI</span>
              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full hidden sm:block"></span>
              <span className="font-medium">Enterprise Ready</span>
            </div>
          </div>
        </footer>
        </div>
      </div>
    </div>
  );
};

export default App;
