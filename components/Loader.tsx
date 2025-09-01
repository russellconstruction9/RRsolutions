
import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center my-12 p-8">
      <div className="relative">
        <div className="animate-spin rounded-full h-20 w-20 border-4 border-secondary-200"></div>
        <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-primary-600 absolute top-0 left-0"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-8 h-8 text-primary-600 animate-pulse-soft" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
      </div>
      <div className="mt-6 text-center space-y-2">
        <p className="text-xl font-semibold text-secondary-800">AI Processing in Progress</p>
        <p className="text-secondary-600">Analyzing your document and generating professional reports...</p>
        <div className="flex items-center justify-center space-x-2 mt-4">
          <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default Loader;
