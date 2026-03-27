import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const mode = searchParams.get('mode') 

  if (code) {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && user) {
      // time delta to check if the user was *just* created in this OAuth flow
      const createdTime = new Date(user.created_at).getTime()
      const signInTime = new Date(user.last_sign_in_at || user.created_at).getTime()
      const isNewUser = (signInTime - createdTime) < 5000

      if (mode === 'login' && isNewUser) {
        // They explicitly clicked Login, but an account was just created instead of found.
        await supabase.auth.signOut()
        return NextResponse.redirect(`${origin}/login?error=not_found`)
      }
      if (mode === 'signup' && !isNewUser) {
        // They clicked Signup, but their account already existed and was just logged in.
        await supabase.auth.signOut()
        return NextResponse.redirect(`${origin}/signup?error=already_exists`)
      }
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }
  return NextResponse.redirect(`${origin}/login`)
}