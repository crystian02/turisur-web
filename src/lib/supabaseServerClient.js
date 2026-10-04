// src/lib/supabaseServerClient.js
import { createClient } from "@supabase/supabase-js";

// Admite SUPABASE_URL directa o el fallback público en caso de configuración unificada en .env
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE;

// Verificación temprana para evitar inicializar instancias nulas en el backend de Node.js
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Faltan credenciales de Supabase en el entorno del servidor.");
}

/**
  Cliente con privilegios administrativos (service_role).
  Se utiliza únicamente en API routes y tareas internas del backend para omitir políticas RLS.
 
  - persistSession: Evita que el servidor intente almacenar cookies o sesiones en memoria compartida.
  - autoRefreshToken: Las claves de servicio no expiran por token refresh; no requieren renovación automática.

 */
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,

  },
  
});