// src/pages/api/comments/index.js
import { supabaseAdmin } from "../../../lib/supabaseServerClient";

/*
  Endpoint para obtener el listado de comentarios, sugerencias y reclamos.
  Ordena los registros del más reciente al más antiguo para el panel de administración.
 */

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { data, error } = await supabaseAdmin
    .from("comments")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ data });
}