import { GoogleGenAI, Type } from "@google/genai";

// Dynamically import pdfjs-dist and set up worker
const pdfjsLib = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.min.mjs');
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.worker.min.mjs';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    throw new Error("API_KEY environment variable not set.");
}
const ai = new GoogleGenAI({ apiKey: API_KEY });

const fileToGenerativePart = async (file: File) => {
    const base64EncodedData = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: {
            data: base64EncodedData,
            mimeType: file.type,
        },
    };
};

const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
};

const getMasterPrompt = () => {
    // FIX: The large template literal was causing parsing errors.
    // Splitting it into two parts and concatenating them resolves the issue without changing the content.
    return `You are an AI assistant specialized in construction project management, operating with the expertise of a seasoned General Contractor and Project Manager. Your primary directive is to analyze a provided property insurance claim estimate (PDF) and transform it into a cohesive set of actionable project management documents. Accuracy, internal consistency, and data validation are paramount.

**Primary Data Validation Protocol**

Before generating any output, you must first perform these primary validation steps:

1.  **Establish the Definitive Total Project Budget:**
    *   Inspect the filename of the uploaded PDF for a dollar amount (e.g., "Estimate-$12345.67.pdf").
    *   Locate the final "Replacement Cost Value" (RCV) total within the PDF's summary page.
    *   **Hierarchy of Truth:** If both sources are available and their values differ, the amount in the filename is the definitive "TOTAL PROJECT BUDGET." If the filename contains no value, the RCV from the PDF summary is the definitive total. You must state which source you are using at the beginning of Section 2.

2.  **Initial Data Reconciliation:**
    *   Briefly scan the line item details and compare their sum to the summary totals. Note any significant discrepancies in the source document itself, as this may indicate an error in the original estimate. This is for awareness, but the Definitive Total Project Budget from Step 1 remains the target for your final outputs.

**Your Task & Required Outputs:**

Analyze the entire document, then generate a single response containing the required sections, formatted exactly as described below. All sections must be internally consistent and reconcile with each other. **IMPORTANT: For any section that requires a table, you MUST generate that table using HTML tags (<table>, <thead>, <tbody>, <tr>, <th>, <td>). Do NOT use markdown tables.**

---

### Section 1: Project Scope of Work

This is a narrative overview of the project, written in plain English for the client and crew. Use standard markdown for this section (headings, lists, bold, etc.).

*   **Header:** Start with a clear header including the Client's Name, Project Address, and the Insurance Claim Number, extracted directly from the PDF.
*   **Summary:** Write a brief, one-paragraph "Overall Project Summary" that describes the project's purpose and the general areas of work.
*   **Structure by Area:** Break the scope down by physical location (e.g., "Basement - Storage Room"). Under each location, create "Demolition" and "Restoration" sub-headings and list the tasks using bullet points.
*   **Language and Tone:** Translate insurance jargon (e.g., "R&R," "DET," "F&I") into clear, actionable tasks (e.g., "Remove and replace," "Detach and reset," "Furnish and install"). Combine related line items into single, logical instructions.
*   **Validation Check:** Ensure every financially significant line item from the estimate is represented by an actionable task in this scope to prevent omissions.

---

### Section 2: Project Budget & Job Costing Summary (Consolidated RCV Budget)

This section provides a high-level project budget for internal GC use. **You MUST format this section as an HTML table.**

*   **Budget Source Declaration:** Begin this section with a paragraph stating the source and value of the definitive TOTAL PROJECT BUDGET.
*   **Format:** Create an HTML table.
*   **Focus on RCV:** All budgeted values must be based on the RCV from the insurance estimate.
*   **Overhead & Profit Calculation Logic (CRITICAL):**
    *   **Part A - Line Item Budgets:** 80% of each line item's original RCV is the direct cost. Allocate this to "Material Budget (RCV)" and "Labor Budget (RCV)".
    *   **Part B - Final Reconciliation:** "Overhead & Profit" is a balancing figure calculated at the end.
*   **Cost Separation Logic:** Intelligently split the 80% adjusted RCV for each line item into Material and Labor.
*   **Table Columns:** The \`<th>\` elements should be: "Category/Task", "Description", "Material Budget (RCV)", "Labor Budget (RCV)", "Total Budget (RCV)".
*   **Totals Section:** The final \`<tbody>\` rows must calculate and display: "Subtotal (Line Items)", "Material Sales Tax", "TOTAL PROJECT BUDGET", and "Overhead & Profit". The grand total must exactly match the definitive budget.

---

### Contractor Work Orders (Multiple Sections)

For each trade identified in the budget (e.g., Painting, Drywall, etc.), generate a separate and distinct work order section. Each work order **MUST** start with the exact header format: \`### Work Order: [TRADE NAME]\`. For example, \`### Work Order: Painting\`.

*   **Format for Each Work Order Section:** Use standard markdown within each section.
    *   \`**BUDGET (RCV):** (e.g., $561.51)\`
    *   \`**KEY MATERIALS & QUANTITIES:** (e.g., ~152 SF of wall painting, 1 door to be painted)\`
    *   \`**INSTRUCTIONS:**\` (A numbered list of specific tasks)
*   **Validation:** The \`BUDGET (RCV)\` must exactly match the "Total Budget (RCV)" for that trade's category in the Section 2 table.

---

### Section 4: Customer Selection & Material Allowance Schedule

Provide the client with a clear schedule of materials they need to select. **You MUST format this section as an HTML table.**

*   **Header:** Start with a markdown heading: \`### Customer Selection & Material Allowance Schedule\`
*   **Introductory Note:** Add a brief introductory paragraph.
*   **Format:** Create an HTML table with \`<th>\` columns: "Selection Item", "Location(s)", "Total Quantity", "Material Allowance (per Unit)", "Total Material Budget (RCV)".
*   **Calculation Logic:**
    *   \`Total Material Budget (RCV)\` is the sum of the 80% adjusted RCV for the material portion.
    *   \`Total Quantity\` is the sum of quantities from the PDF.
    *   \`Material Allowance (per Unit)\` = \`Total Material Budget (RCV)\` / \`Total Quantity\`.
`;
}

export const processPdfAndGenerateReport = async (file: File): Promise<string> => {
    try {
        const fileBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(fileBuffer).promise;
        const numPages = pdf.numPages;
        let fullText = '';
        
        for (let i = 1; i <= numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += `--- Page ${i} ---\n${pageText}\n\n`;
        }

        const masterPrompt = getMasterPrompt();

        const fullPrompt = `${masterPrompt}\n\n---
        
Here is the data for analysis:

**PDF Filename:** "${file.name}"

**Extracted PDF Text Content:**
\`\`\`
${fullText}
\`\`\`

Now, please generate the required sections as a single, cohesive response based on the instructions and the provided data. Remember to use HTML tables for Sections 2 and 4, and create a separate '### Work Order: [Trade]' section for each trade.`;

        const generativePart = await fileToGenerativePart(file);

        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [{ text: fullPrompt }, generativePart] },
        });
        
        if (!result.text) {
          throw new Error("Received an empty response from the AI model.");
        }
        
        return result.text;

    } catch (error) {
        console.error("Error processing PDF or calling Gemini API:", error);
        if (error instanceof Error && error.message.includes('API_KEY')) {
             throw new Error("Gemini API key is not configured correctly. Please check your environment variables.");
        }
        throw new Error("Failed to process the PDF and generate the report.");
    }
};

export const generatePdfFromHtml = async (htmlContent: string, title: string): Promise<string> => {
    const companyInfo = {
      "company_name": "Lake City Restoration",
      "address": "306 Argonne Rd, Warsaw, IN 46580",
      "phone": "(574) 385-9111",
      "email": "911@lcrestore.com",
      "website": "https://www.lcrestore.com",
      "certifications": ["IICRC Certified Firm"],
    };

    const prompt = `
You are a professional document designer. Your task is to create a branded PDF document from the provided HTML content and company branding information.

**Company Branding Information:**
- Company Name: ${companyInfo.company_name}
- Address: ${companyInfo.address}
- Phone: ${companyInfo.phone}
- Email: ${companyInfo.email}
- Website: ${companyInfo.website}
- Certifications: ${companyInfo.certifications.join(', ')}
- Font: Arial, Helvetica, sans-serif
- Primary Color: Use a professional, print-safe deep red for accents (e.g., headers).
- Neutral Color: #111111 for body text.

**Instructions:**
1.  Create a professional, clean, and modern layout for the PDF.
2.  Add a header to each page that includes the company name and contact information. A simple, clean footer with the website and page number is also appropriate.
3.  Use the specified fonts and colors to style the document.
4.  The main content of the document is provided below in HTML format. Render this HTML content as the body of the PDF.
5.  The final output must be a single JSON object containing the base64-encoded string of the generated PDF file. Do not include any other text or explanation.

**Document Title:** ${title}

**HTML Content to include in the PDF body:**
\`\`\`html
${htmlContent}
\`\`\`
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        pdfContent: {
                            type: Type.STRING,
                            description: "The base64 encoded string of the generated PDF file.",
                        },
                    },
                    required: ["pdfContent"],
                },
            },
        });

        const jsonResponse = JSON.parse(response.text);
        
        if (!jsonResponse.pdfContent) {
            throw new Error("API did not return the expected pdfContent field.");
        }
        
        return jsonResponse.pdfContent;

    } catch (error) {
        console.error("Error generating PDF with Gemini API:", error);
        throw new Error("Failed to generate the PDF via the AI service.");
    }
};
