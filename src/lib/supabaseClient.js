// src/lib/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Variables NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY no definidas en el cliente.");
}

/*
   Instancia singleton para el navegador
   Configuraciones de autenticación:

  - persistSession: Mantiene la sesión activa del usuario en localStorage entre recargas de página.
  - autoRefreshToken: Renueva automáticamente el JWT antes de que expire.
  - detectSessionInUrl: Permite procesar enlaces mágicos o tokens de recuperación en la URL.
  - lock: en null por errores de Navigator LockManager   
  
  Este error aparecía repetidamente en la consola al hacer clic en el mapa
  o al volver de segundo plano (visibilitychange). Supabase usa navigator.locks
  por defecto para evitar que dos pestañas refresquen el token al mismo tiempo,
  pero en algunos navegadores y entornos móviles esa API falla y bloquea la sesión.
  
  Como esta app es de un solo administrador, es seguro desactivarlo.

 */

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    lock: null,
  },
});