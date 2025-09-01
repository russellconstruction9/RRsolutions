
import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center my-8">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-blue"></div>
      <p className="mt-4 text-brand-gray font-semibold">AI is analyzing your document...</p>
    </div>
  );
};

export default Loader;
