
import { GoogleGenAI, Type } from "@google/genai";

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

const withBackoff = async <T>(fn: () => Promise<T>, tries = 3): Promise<T> => {
    let delay = 1000;
    for (let i = 0; i < tries; i++) {
        try {
            return await fn();
        } catch (e: any) {
            console.warn(`API call attempt ${i + 1} of ${tries} failed. Retrying in ${delay}ms...`, e);
            const isRetriable = e.message?.includes('500') || e.message?.includes('503') || e.message?.includes('429') || e.message?.includes('UNKNOWN');
            if (!isRetriable || i === tries - 1) {
                throw e; 
            }
            await new Promise(r => setTimeout(r, delay));
            delay *= 2; 
        }
    }
    throw new Error("All retry attempts failed.");
};


const getSystemInstruction = () => {
    return `You are an AI assistant specialized in construction project management. Analyze the provided property insurance claim estimate PDF and transform it into a structured JSON object.

**Validation Rules:**
1.  **Total Project Budget:** The definitive budget is the dollar amount in the PDF filename (e.g., "Estimate-$12345.67.pdf"). If not present, use the final "Replacement Cost Value" (RCV) from the PDF's summary. You must state the source you used in the 'budgetSourceInfo' field.
2.  **Budget Calculation:** For budget line items, use 80% of the original RCV as the direct cost for materials and labor. The remaining 20% should be accounted for in the 'overheadAndProfit' calculation to ensure the final total matches the definitive budget.
3.  **Plain Language:** Translate insurance jargon (e.g., "R&R," "DET") into clear, actionable tasks (e.g., "Remove and replace," "Detach and reset").

**Task:**
Analyze the entire document and generate a single, valid JSON object that adheres to the provided schema. The data must be internally consistent. For example, the total of the work order budgets should align with the main project budget.
`;
}

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        scopeOfWork: {
            type: Type.OBJECT,
            description: "Narrative project scope, broken down by location.",
            properties: {
                clientName: { type: Type.STRING },
                projectAddress: { type: Type.STRING },
                claimNumber: { type: Type.STRING },
                overallSummary: { type: Type.STRING },
                breakdown: {
                    type: Type.ARRAY,
                    description: "Scope broken down by area.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            area: { type: Type.STRING },
                            demolitionTasks: { type: Type.ARRAY, items: { type: Type.STRING } },
                            restorationTasks: { type: Type.ARRAY, items: { type: Type.STRING } },
                        },
                        required: ["area"]
                    }
                }
            }
        },
        projectBudget: {
            type: Type.OBJECT,
            description: "Consolidated RCV budget summary.",
            properties: {
                budgetSourceInfo: { type: Type.STRING },
                lineItems: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            category: { type: Type.STRING },
                            description: { type: Type.STRING },
                            materialBudget: { type: Type.NUMBER },
                            laborBudget: { type: Type.NUMBER },
                            totalBudget: { type: Type.NUMBER },
                        }
                    }
                },
                subtotal: { type: Type.NUMBER },
                salesTax: { type: Type.NUMBER },
                totalProjectBudget: { type: Type.NUMBER },
                overheadAndProfit: { type: Type.NUMBER },
            }
        },
        workOrders: {
            type: Type.ARRAY,
            description: "Work orders for each trade.",
            items: {
                type: Type.OBJECT,
                properties: {
                    trade: { type: Type.STRING },
                    budget: { type: Type.NUMBER },
                    keyMaterials: { type: Type.STRING },
                    instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["trade"]
            }
        },
        selectionSchedule: {
            type: Type.OBJECT,
            description: "Customer selection and material allowance schedule.",
            properties: {
                introductoryNote: { type: Type.STRING },
                items: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            item: { type: Type.STRING },
                            locations: { type: Type.STRING },
                            quantity: { type: Type.STRING },
                            allowancePerUnit: { type: Type.NUMBER },
                            totalMaterialBudget: { type: Type.NUMBER },
                        }
                    }
                }
            }
        }
    }
};

export const processPdfAndGenerateReport = async (file: File): Promise<string> => {
    try {
        const systemInstruction = getSystemInstruction();
        const userPrompt = `PDF Filename for budget validation: "${file.name}". Please analyze the attached PDF and generate the required JSON output based on your instructions.`;
        const generativePart = await fileToGenerativePart(file);

        const result = await withBackoff(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [{ text: userPrompt }, generativePart] },
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: responseSchema
            }
        }));
        
        if (!result.text) {
          throw new Error("Received an empty response from the AI model.");
        }
        
        return result.text;

    } catch (error) {
        console.error("Error processing PDF or calling Gemini API:", error);
        if (error instanceof Error && error.message.includes('API_KEY')) {
             throw new Error("Gemini API key is not configured correctly. Please check your environment variables.");
        }
        throw new Error(`Failed to process the PDF and generate the report. ${error instanceof Error ? error.message : ''}`);
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
