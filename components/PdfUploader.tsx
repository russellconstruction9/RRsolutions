
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
    <div className="flex flex-col items-center w-full space-y-8">
      <div 
        className="w-full border-2 border-dashed border-slate-300/60 rounded-3xl p-16 text-center bg-gradient-to-br from-slate-50/80 to-brand-50/40 hover:border-brand-400/60 hover:bg-gradient-to-br hover:from-brand-50/60 hover:to-accent-50/40 transition-all duration-500 cursor-pointer group relative overflow-hidden shadow-inner hover:shadow-glow"
        onClick={handleButtonClick}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-brand-500/8 to-accent-500/8 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-brand-100/30 to-accent-100/30 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileSelect}
          className="hidden"
          ref={fileInputRef}
          disabled={isLoading}
        />
        <div className="relative z-10">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-brand-500 to-brand-700 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-xl group-hover:shadow-2xl">
            <svg className="w-12 h-12 text-white" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true" strokeWidth="1.5">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          {selectedFile ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-2xl font-bold text-slate-800">File Selected</p>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-soft">
                <p className="text-lg font-semibold text-slate-700 mb-2">{selectedFile.name}</p>
                <p className="text-sm text-slate-500">
                  Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <p className="text-sm text-slate-500 font-medium">Click to select a different file</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <p className="text-3xl font-bold text-slate-800 mb-4">Upload Your PDF Document</p>
                <p className="text-xl text-slate-600 font-light">Click here or drag and drop your insurance claim estimate</p>
              </div>
              <div className="flex items-center justify-center space-x-8 mt-8 text-sm">
                <div className="flex items-center bg-white/60 backdrop-blur-sm px-4 py-3 rounded-xl border border-slate-200/50 shadow-soft">
                  <svg className="w-5 h-5 mr-2 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="font-semibold text-slate-700">PDF Format</span>
                </div>
                <div className="flex items-center bg-white/60 backdrop-blur-sm px-4 py-3 rounded-xl border border-slate-200/50 shadow-soft">
                  <svg className="w-5 h-5 mr-2 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                  <span className="font-semibold text-slate-700">Up to 50MB</span>
                </div>
                <div className="flex items-center bg-white/60 backdrop-blur-sm px-4 py-3 rounded-xl border border-slate-200/50 shadow-soft">
                  <svg className="w-5 h-5 mr-2 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="font-semibold text-slate-700">Secure Processing</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <button
        onClick={onSubmit}
        disabled={isLoading || !selectedFile}
        className="group relative w-full sm:w-auto inline-flex justify-center items-center px-16 py-5 border-0 text-xl font-bold rounded-2xl shadow-xl text-white bg-gradient-to-r from-brand-600 via-brand-500 to-brand-700 hover:from-brand-700 hover:via-brand-600 hover:to-brand-800 focus:outline-none focus:ring-4 focus:ring-brand-500/50 disabled:from-slate-400 disabled:via-slate-500 disabled:to-slate-600 disabled:cursor-not-allowed transition-all duration-500 transform hover:scale-105 hover:shadow-2xl disabled:hover:scale-100 min-w-[280px] overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="relative z-10 flex items-center">
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-4 h-7 w-7 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="tracking-wide">Processing Document...</span>
            </>
          ) : (
            <>
              <svg className="w-7 h-7 mr-4 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="tracking-wide">Generate Professional Documents</span>
            </>
          )}
        </div>
      </button>
    </div>
  );
};

export default PdfUploader;
