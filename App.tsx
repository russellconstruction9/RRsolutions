
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
