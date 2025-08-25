import { Suspense } from 'react';
import NotebookLMLanding from '@/components/landing/NotebookLMLanding';

// Loading component with better styling
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/60 via-amber-50/50 to-orange-50/40 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-3 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg">Loading PaperLM...</p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <NotebookLMLanding />
    </Suspense>
  );
}
