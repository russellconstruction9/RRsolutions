
import React, { useRef } from 'react';

interface PdfUploaderProps {
  onFileChange: (file: File | null) => void;
  onSubmit: () => void;
  isLoading: boolean;
  selectedFile: File | null;
}

const PdfUploader: React.FC<PdfUploaderProps> = ({ onFileChange, onSubmit, isLoading, selectedFile }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    onFileChange(file);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div 
        className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:border-brand-blue transition-colors duration-300 cursor-pointer"
        onClick={handleButtonClick}
      >
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileSelect}
          className="hidden"
          ref={fileInputRef}
          disabled={isLoading}
        />
        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="mt-2 text-sm text-gray-600">
          {selectedFile ? `Selected: ${selectedFile.name}` : 'Click to upload or drag and drop a PDF file'}
        </p>
        <p className="text-xs text-gray-500">PDF up to 50MB</p>
      </div>
      <button
        onClick={onSubmit}
        disabled={isLoading || !selectedFile}
        className="mt-6 w-full sm:w-auto inline-flex justify-center items-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-brand-blue hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-300"
      >
        {isLoading ? 'Processing...' : 'Generate Documents'}
      </button>
    </div>
  );
};

export default PdfUploader;
