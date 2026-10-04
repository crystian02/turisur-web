// src/pages/api/schedules/delete.js
import { supabaseAdmin } from "../../../lib/supabaseServerClient";

/*
  Endpoint para eliminar un itinerario por su identificador único.
 */
export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { id } = req.body;

  // Valida que el ID venga en la petición antes de consultar la base de datos
  if (!id) {
    return res.status(400).json({ message: "Se requiere el ID del itinerario." });
  }

  const { data, error } = await supabaseAdmin
    .from("schedules")
    .delete()
    .eq("id", id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ data });
}