import supabase from '../lib/supabaseClient'
import Portal from '../components/Portal'

export default function Home() {
  return <Portal supabase={supabase} />
}
