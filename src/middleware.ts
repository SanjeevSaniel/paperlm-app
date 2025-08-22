import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)', 
  '/sign-up(.*)', 
  '/',
  '/how-it-works',
  '/privacy',
  '/terms',
  '/help',
  '/contact',
  '/api/cleanup', // Public cleanup endpoint
  '/api/test-neon' // Public test endpoint
]);

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;
  const { userId } = await auth();
  
  // For public routes, allow access without authentication
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }
  
  // For all other routes, require authentication
  if (!userId) {
    // Redirect to sign-in page for unauthenticated users
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', pathname);
    return NextResponse.redirect(signInUrl);
  }
  
  // For paper routes, just ensure user is authenticated
  // The app will handle user ID generation and validation
  if (pathname.startsWith('/paper')) {
    return NextResponse.next();
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};