// src/pages/api/reports/revenue.js
import { supabaseAdmin } from "../../../lib/supabaseServerClient";

/*
  Endpoint para obtener el historial de transacciones autorizadas y calcular ingresos.
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  try {
    // Consulta solo los pagos autorizados y ordena por fecha ascendente 
    const { data, error } = await supabaseAdmin
      .from("payments")
      .select("amount_clp, transaction_date, created_at, status")
      .eq("status", "authorized")
      .order("created_at", { ascending: true });

    if (error) throw error;

    return res.status(200).json({ status: "1", data });
  } catch (error) {
    console.error("Error al obtener reporte de ingresos:", error);
    return res.status(500).json({ status: "0", error: error.message });
  }
}