import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// 环境变量缺失时不让整页崩溃,提交时会给出友好报错
export const supabase = url && key ? createClient(url, key) : null;
