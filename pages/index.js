import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Portal from '../components/Portal'
import React, { useState } from 'react';
import React, { useState, useEffect, useRef } from 'react';

const supabase = createClient(
  'https://mezpmegvgeskhdckjfpa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lenBtZWd2Z2Vza2hkY2tqZnBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNDY3NzcsImV4cCI6MjA3MjYyMjc3N30.ZB4Zp_8cgZSrzIcH7TPqZ8KfDSTlfvT0OyHfpt0BWWU'
)

export default function Home() {
  return <Portal supabase={supabase} />
}
