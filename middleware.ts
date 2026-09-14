import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Only protected application pages need a session refresh. The previous
  // broad matcher performed an Auth request for public pages, API downloads
  // and every non-static request.
  matcher: ["/projects/:path*"],
};
