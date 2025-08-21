import { Suspense } from 'react';
import NotebookLMLanding from '@/components/landing/NotebookLMLanding';

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NotebookLMLanding />
    </Suspense>
  );
}
