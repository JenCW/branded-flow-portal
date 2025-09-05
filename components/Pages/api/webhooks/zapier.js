import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Verify webhook signature (optional but recommended)
  const signature = req.headers['x-zapier-signature']
  const body = JSON.stringify(req.body)
  
  if (process.env.WEBHOOK_SECRET) {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.WEBHOOK_SECRET)
      .update(body)
      .digest('hex')

    if (signature !== expectedSignature) {
      return res.status(401).json({ error: 'Invalid signature' })
    }
  }

  const { type, data } = req.body

  try {
    switch (type) {
      case 'automation_run':
        await supabase
          .from('automation_runs')
          .insert({
            automation_id: data.automation_id,
            status: data.status,
            started_at: data.started_at,
            completed_at: data.completed_at,
            logs: data.logs,
            results: data.results
          })
        break

      case 'new_lead':
        await supabase
          .from('leads')
          .insert({
            client_id: data.client_id,
            email: data.email,
            name: data.name,
            company: data.company,
            source: data.source,
            data: data
          })
        break

      case 'automation_update':
        await supabase
          .from('automations')
          .update({
            total_runs: data.total_runs,
            successful_runs: data.successful_runs,
            last_run_at: data.last_run_at,
            status: data.status
          })
          .eq('external_id', data.external_id)
        break

      default:
        console.log('Unknown webhook type:', type)
    }

    res.status(200).json({ success: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}