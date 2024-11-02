import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: ["/", "/api/public(.*)"],
  ignoredRoutes: [
    "/api/fetch-image",
    "/api/generate-avatar-image",
    "/api/generate"
  ]
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}; 