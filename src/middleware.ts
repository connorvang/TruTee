import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher(['/','/organization/(.*)','/sign-in(.*)', '/sign-up(.*)', '/api/webhooks/(.*)'])
const isAdminRoute = createRouteMatcher(['/admin(.*)'])
const isCreateOrgRoute = createRouteMatcher(['/admin/create-organization(.*)'])

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { userId, orgId, redirectToSignIn } = await auth()

  // If the user isn't signed in and the route isn't public, redirect to sign-in
  if (!userId && !isPublicRoute(req)) {
    return redirectToSignIn({ returnBackUrl: req.url })
  }

  // For admin routes, check organization requirement
  // Skip the check for the create-organization route
  if (userId && isAdminRoute(req) && !isCreateOrgRoute(req) && !orgId) {
    const orgCreationUrl = new URL('/admin/create-organization', req.url)
    return NextResponse.redirect(orgCreationUrl)
  }

  // Allow access to public routes and authenticated users
  if (isPublicRoute(req) || userId) {
    return NextResponse.next()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}