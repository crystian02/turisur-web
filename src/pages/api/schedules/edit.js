// src/pages/api/schedules/edit.js
import { supabaseAdmin } from "../../../lib/supabaseServerClient";

/**
 * Endpoint para actualizar los datos de un itinerario existente.
 */
export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { id, origen, destino, dia, hora_salida, precio } = req.body;

  // Evita actualizar registros si no se envía el ID
  if (!id) {
    return res.status(400).json({ message: "Se requiere el ID del itinerario." });
  }

  const { data, error } = await supabaseAdmin
    .from("schedules")
    .update({ origen, destino, dia, hora_salida, precio })
    .eq("id", id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ data });
}