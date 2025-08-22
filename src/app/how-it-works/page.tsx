'use client';

import { Suspense } from 'react';
import ProductWalkthrough from '@/components/ProductWalkthrough';

export default function HowItWorksPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductWalkthrough />
    </Suspense>
  );
}