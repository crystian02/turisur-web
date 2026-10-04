// src/pages/api/comments/reply.js
import { supabaseAdmin } from "../../../lib/supabaseServerClient";

/*
  Endpoint para registrar la respuesta administrativa a un comentario o sugerencia.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { id, respuesta } = req.body;

  if (!id || !respuesta?.trim()) {
    return res.status(400).json({ error: "Se requiere el ID del comentario y el texto de respuesta." });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("comments")
      .update({
        respuesta: respuesta.trim(),
        fecha_respuesta: new Date().toISOString(),
      })
      .eq("id", id)
      .select();

    if (error) throw error;

    return res.status(200).json({
      status: "1",
      data,
    });
  } catch (error) {
    console.error("Error al responder comentario:", error);
    return res.status(500).json({
      status: "0",
      error: error.message,
    });
  }
}