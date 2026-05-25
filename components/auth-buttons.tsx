"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

export function GoogleLoginButton() {
  async function signIn() {
    const supabase = createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${siteUrl}/auth/callback`
      }
    });
  }

  return <Button onClick={signIn}>Zaloguj przez Google</Button>;
}

export function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button variant="secondary" onClick={signOut}>
      Wyloguj
    </Button>
  );
}
