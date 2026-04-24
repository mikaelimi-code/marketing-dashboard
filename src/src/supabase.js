import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://axkqfqqaffqhbnvgyvhu.supabase.co'
const SUPABASE_KEY = 'sb_publishable_KPSHnzry3YQXN4T3j64M6A_sLJF-Tip'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
