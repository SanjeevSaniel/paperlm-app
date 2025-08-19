'use client';

import { useUser } from '@clerk/nextjs';
import AppLayout from '@/components/AppLayout';
import { useEffect, useState } from 'react';

export default function Home() {
  const { isLoaded } = useUser();
  const [forceRender, setForceRender] = useState(false);

  // Fallback to render after 3 seconds if Clerk isn't loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setForceRender(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!isLoaded && !forceRender) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-purple-50/60 via-amber-50/50 to-orange-50/40 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4'></div>
          <p className='text-slate-600'>Loading...</p>
        </div>
      </div>
    );
  }

  // Always show the layout - authentication is handled within components
  return <AppLayout />;
}
