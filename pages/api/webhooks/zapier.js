import supabase from '../lib/supabaseClient'
import crypto from 'crypto'


export default async function handler(req, res) {
  const signature = req.headers['x-zapier-signature']
  const payload = JSON.stringify(req.body)
  const secret = process.env.WEBHOOK_SECRET

  const hmac = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  if (signature !== hmac) {
    return res.status(401).json({ error: 'Invalid signature' })
  }

  // ✅ Signature verified — continue processing
  const { email, name } = req.body

  const { data, error } = await supabase
    .from('contacts')
    .insert([{ email, name }])

  if (error) {
    console.error('Supabase insert error:', error)
    return res.status(500).json({ error: 'Database error' })
  }

  res.status(200).json({ success: true, data })
}
