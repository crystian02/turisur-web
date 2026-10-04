// src/pages/api/schedules/index.js
import { supabaseAdmin } from "../../../lib/supabaseServerClient";

/*
  API pública para consultar itinerarios y salidas de buses.
  Atiende las consultas del buscador en la landing page y admite filtros opcionales.
 */

export default async function handler(req, res) {
  // Solo se permiten consultas de lectura
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { origen, destino, fecha } = req.query;

  // Consulta base ordenada por ID para mantener consistencia en la lista
  let query = supabaseAdmin
    .from("schedules")
    .select("*")
    .order("id", { ascending: true });

  // Filtros condicionales según los parámetros recibidos en la URL
  if (origen) {
    query = query.eq("origen", origen);
  }

  if (destino) {
    query = query.eq("destino", destino);
  }

  if (fecha) {
    query = query.eq("dia", fecha);
  }

  const { data, error } = await query;

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ data });
}