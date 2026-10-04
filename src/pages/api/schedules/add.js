// src/pages/api/schedules/add.js
import { supabaseAdmin } from "../../../lib/supabaseServerClient";

/*
  Endpoint para registrar un nuevo itinerario de viaje.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { origen, destino, dia, hora_salida, precio } = req.body;

  // Comprueba que los campos requeridos estén presentes antes de insertar
  if (!origen || !destino || !dia || !hora_salida || !precio) {
    return res.status(400).json({ message: "Todos los campos son obligatorios." });
  }

  const { data, error } = await supabaseAdmin
    .from("schedules")
    .insert([{ origen, destino, dia, hora_salida, precio }]);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ data });
}