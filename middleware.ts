// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// 1. Inngest route ke liye matcher banayein
const isPublicRoute = createRouteMatcher(['/api/inngest(.*)', '/']); 
const isSellerRoute = createRouteMatcher(['/seller(.*)']);

export default clerkMiddleware(async (auth, req) => {

  // 2. Agar request Inngest ki hai, toh auth check skip karein
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  const authObj = await auth();
  const { sessionClaims, userId } = authObj;
  const role = (sessionClaims?.metadata as any)?.role;

  if (isSellerRoute(req)) {
    if (!userId || role !== 'seller') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }
  
  return NextResponse.next();
});

export const config = {
  matcher:[
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};