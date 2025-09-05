import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  const { code } = req.query

  if (code) {
    await supabase.auth.exchangeCodeForSession(code)
  }

  res.redirect('/')
}