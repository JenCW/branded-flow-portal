import { useState, useEffect, useMemo, useCallback } from "react"; // include whatever hooks you actually use
import { createClient } from '@supabase/supabase-js';
import Portal from '../components/Portal';


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);


export default function Home() {
  return <Portal supabase={supabase} />;
}
