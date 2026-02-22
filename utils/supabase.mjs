// ไฟล์: utils/supabase.mjs
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// โหลดค่าจากไฟล์ .env
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// สร้างตัวเชื่อมต่อ Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;