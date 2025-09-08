import supabase from '../../lib/supabaseClient'


if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Supabase environment variables are missing.')
}

  const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

/**
 * API route handler for exchanging an OAuth code for a Supabase session.
 * 
 * @param {import('next').NextApiRequest} req - The API request object.
 * @param {import('next').NextApiResponse} res - The API response object.
 */
export default async function handler(req, res) {
  const { code } = req.query

  if (!code) {
    return res.status(400).json({ error: 'Missing code parameter' })
  }

  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Supabase auth error:', error.message)
      return res.status(401).json({ error: error.message })
    }

    if (!data || !data.session) {
      console.error('No session returned from Supabase')
      return res.status(401).json({ error: 'Authentication failed: No session returned' })
    }

    // Optionally set a cookie or session here

    res.redirect('/')
  } catch (err) {
    console.error('Unexpected error:', err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
