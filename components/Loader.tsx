
import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center my-16 p-12">
      <div className="relative">
        <div className="animate-spin rounded-full h-24 w-24 border-4 border-slate-200"></div>
        <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-brand-600 absolute top-0 left-0"></div>
        <div className="animate-spin rounded-full h-24 w-24 border-r-4 border-accent-500 absolute top-0 left-0" style={{ animationDirection: 'reverse', animationDuration: '3s' }}></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-10 h-10 text-brand-600 animate-pulse-soft" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
      </div>
      <div className="mt-8 text-center space-y-4">
        <p className="text-2xl font-bold text-slate-800">AI Processing in Progress</p>
        <p className="text-lg text-slate-600 font-light max-w-md">Analyzing your document and generating professional reports...</p>
        <div className="flex items-center justify-center space-x-3 mt-6">
          <div className="w-3 h-3 bg-brand-500 rounded-full animate-bounce shadow-soft"></div>
          <div className="w-3 h-3 bg-brand-500 rounded-full animate-bounce shadow-soft" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-3 h-3 bg-brand-500 rounded-full animate-bounce shadow-soft" style={{ animationDelay: '0.2s' }}></div>
        </div>
        <div className="mt-8 bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-soft max-w-md mx-auto">
          <p className="text-sm text-slate-600 font-medium">This may take a few moments while our AI analyzes your document structure and generates comprehensive project documentation.</p>
        </div>
      </div>
    </div>
  );
};

export default Loader;
