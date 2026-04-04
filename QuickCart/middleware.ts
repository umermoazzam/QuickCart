import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isSellerRoute = createRouteMatcher(['/seller(.*)']);

export default clerkMiddleware(async (auth, req) => {

  const authObj = await auth();
  const { sessionClaims, userId } = authObj;

  const role = (sessionClaims?.metadata as any)?.role;

  console.log("Current Request URL:", req.url); 
  console.log("User Role from Token:", role);

  if (isSellerRoute(req)) {

    if (!userId || role !== 'seller') {
      console.log("Access Denied: Redirecting to Home");
      return NextResponse.redirect(new URL('/', req.url));
    }
    console.log("Access Granted to Seller Dashboard");
  }
  
  return NextResponse.next();
});

export const config = {
  matcher:[
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};