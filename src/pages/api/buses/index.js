//src/pages/api/buses/index.js

import axios from "axios";

const BASE_URL =
  process.env.TURISUR_MOBILE_BACKEND_URL ||
  process.env.NEXT_PUBLIC_TURISUR_MOBILE_BACKEND_URL ||
  "https://turisur-mobileback.onrender.com";

const OFFLINE_TIMEOUT_MS = 25000;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: true, message: "Método no permitido" });
  }

  try {
    const backendRes = await axios.get(`${BASE_URL}/api/all_car_locations`, {
      timeout: 6000,
      headers: { Accept: "application/json" },
    });

    const data = backendRes.data || {};
    const payload = data.payload;

    if (!Array.isArray(payload)) {
      return res.status(200).json({ error: false, data: [] });
    }

    const now = Date.now();

    const mapped = payload
      .filter((bus) => bus && bus.lat != null && (bus.long != null || bus.lng != null))
      .map((bus) => {
        const updatedAtMs =
          bus.updated_at_ms ||
          (bus.updated_at ? new Date(bus.updated_at).getTime() : now);

        const isOffline = now - updatedAtMs > OFFLINE_TIMEOUT_MS;
        const lat = Number(bus.lat);
        const lng = Number(bus.long ?? bus.lng);

        return {
          id: String(bus.driver_id || bus.uuid || bus.id || ""),
          alias: bus.alias || `Bus ${String(bus.driver_id || bus.uuid || "").slice(-4)}`,
          plate: bus.plate || null,
          lat,
          lng,
          last_lat: lat,
          last_lng: lng,
          speed: Number(bus.speed || 0),
          last_speed: Number(bus.speed || 0),
          degree: Number(bus.degree || 0),
          last_heading: Number(bus.degree || 0),
          updated_at: bus.updated_at || new Date(updatedAtMs).toISOString(),
          updated_at_ms: updatedAtMs,
          is_offline: isOffline,
          source: bus.source || "iot",
        };
      });

    return res.status(200).json({ error: false, data: mapped });
  } catch (error) {
    console.error("[API /api/buses] Error:", error.message);
    return res.status(200).json({
      error: false,
      message: "No se pudieron obtener las ubicaciones",
      data: [],
    });
  }
}