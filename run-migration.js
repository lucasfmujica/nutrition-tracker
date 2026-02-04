/**
 * Migration script to add bedtime and wake_time columns to oura_log
 * Run with: node run-migration.js
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no encontrados en .env.local');
  process.exit(1);
}

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runMigration() {
  console.log('🔄 Iniciando migración: Agregar bedtime y wake_time a oura_log...\n');

  try {
    // Read the migration SQL file
    const sql = readFileSync('./supabase-add-sleep-timing.sql', 'utf8');

    console.log('📄 SQL a ejecutar:');
    console.log('---');
    console.log(sql);
    console.log('---\n');

    // Execute the migration using raw SQL
    // Note: Supabase client doesn't directly support raw SQL execution
    // We need to use the SQL editor or postgREST directly

    // Alternative: Use RPC to execute raw SQL (requires a function in DB)
    // For now, we'll instruct the user to run it manually

    console.log('⚠️  IMPORTANTE:');
    console.log('El cliente de Supabase no soporta ejecución directa de SQL DDL.');
    console.log('Por favor, ejecuta la migración manualmente siguiendo las instrucciones en:');
    console.log('📄 MIGRATION-INSTRUCTIONS.md\n');

    console.log('O copia y pega el SQL de arriba en el SQL Editor de Supabase.\n');

    console.log('✅ Después de ejecutar el SQL, los datos de Oura se sincronizarán automáticamente.');

  } catch (error) {
    console.error('❌ Error ejecutando migración:', error);
    process.exit(1);
  }
}

runMigration();
