// src/components/Buses/BusMapDetail.js
"use client";

import { useEffect, useState } from "react";
import { 
  FaArrowLeft, 
  FaBus, 
  FaWifi, 
  FaTachometerAlt, 
  FaClock, 
  FaSyncAlt, 
  FaCircle,
  FaMapMarkerAlt
} from "react-icons/fa";
import BusMap from "./BusMap";

// CAMBIO: se añade mini = false por consistencia con los otros
// componentes (RevenueDashboard y ListComments). Actualmente este
// componente siempre se usa como vista completa, por lo que el flag
// no cambia nada visualmente. Pero deja el patrón unificado.
export default function BusMapDetail({ goTo, mini = false }) {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBus, setSelectedBus] = useState(null);
  const [isDark, setIsDark] = useState(false);

  // Detecta el estado del tema leyendo la clase del body
  useEffect(() => {
    const checkDark = () => {
      setIsDark(document.body.classList.contains("admin-dark"));
    };
    checkDark();

    const observer = new MutationObserver(checkDark);
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const fetchBuses = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/buses");
      const json = await res.json();
      if (!json.error && Array.isArray(json.data)) {
        setBuses(json.data);
      }
    } catch (err) {
      console.error("[BusMapDetail] Error al consultar flota:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuses();
    const interval = setInterval(fetchBuses, 10000);
    return () => clearInterval(interval);
  }, []);

  const busesOnline = buses.filter((b) => !b.is_offline);

  // Paleta dinámica según modo claro/oscuro
  const theme = {
    bgCard: isDark ? "#1e293b" : "#ffffff",
    bgHeader: isDark ? "#0f172a" : "#f8fafc",
    border: isDark ? "#334155" : "#e2e8f0",
    textPrimary: isDark ? "#f8fafc" : "#0f172a",
    textMuted: isDark ? "#94a3b8" : "#64748b",
    cardItemBg: isDark ? "#0f172a" : "#ffffff",
    cardSelectedBg: isDark ? "rgba(37, 99, 235, 0.25)" : "rgba(37, 99, 235, 0.1)",
    cardSelectedBorder: isDark ? "#3b82f6" : "#2563eb",
  };

  return (
    <div className="container-fluid px-0 bus-detail-container">
      {/* Barra superior adaptada a modo oscuro.
          Se muestra siempre porque este componente solo se usa
          como vista completa. Si en el futuro se usa con mini,
          bastará con envolver este bloque en {!mini && (...)}. */}
      <div 
        className="d-flex align-items-center justify-content-between mb-3 p-3 rounded shadow-sm bus-detail-header"
        style={{
          backgroundColor: theme.bgCard,
          border: `1px solid ${theme.border}`,
          color: theme.textPrimary,
        }}
      >
        <div className="d-flex align-items-center gap-3">
          <button
            type="button"
            className="btn btn-sm d-flex align-items-center gap-2"
            style={{
              backgroundColor: isDark ? "#334155" : "#f1f5f9",
              color: theme.textPrimary,
              border: `1px solid ${theme.border}`,
            }}
            onClick={() => goTo("dashboard")}
          >
            <FaArrowLeft />
            <span>Volver</span>
          </button>
          <div>
            <h5 className="mb-0 fw-bold d-flex align-items-center gap-2 bus-detail-title" style={{ color: theme.textPrimary }}>
              <FaBus className="text-primary" />
              <span>Monitoreo de Flota</span>
            </h5>
            <small className="bus-detail-subtitle" style={{ color: theme.textMuted }}>
              Corredor Valdivia - San José de la Mariquina - Mehuín
            </small>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-success py-2 px-3 d-flex align-items-center gap-1 font-monospace">
            <FaCircle size={8} />
            <span>{busesOnline.length} en ruta</span>
          </span>
          <span className="badge bg-secondary py-2 px-3 font-monospace">
            {buses.length} reg.
          </span>
          <button
            type="button"
            className="btn btn-sm"
            style={{
              backgroundColor: isDark ? "#334155" : "#f8fafc",
              color: theme.textPrimary,
              border: `1px solid ${theme.border}`,
            }}
            onClick={fetchBuses}
            title="Recargar flota"
          >
            <FaSyncAlt className={loading ? "fa-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Grid: Lista de buses a la izquierda + Mapa a la derecha */}
      <div className="row g-3">
        {/* Panel lateral: Unidades Activas */}
        <div className="col-lg-4 col-md-5">
          <div 
            className="card shadow-sm border-0 h-100"
            style={{ backgroundColor: theme.bgCard, border: `1px solid ${theme.border}` }}
          >
            <div 
              className="card-header py-2 d-flex justify-content-between align-items-center"
              style={{ backgroundColor: theme.bgHeader, borderBottom: `1px solid ${theme.border}` }}
            >
              <h6 className="mb-0 fw-bold small text-uppercase" style={{ color: theme.textMuted }}>
                Unidades Activas ({buses.length})
              </h6>
              <small className="text-primary fw-semibold" style={{ fontSize: 11 }}>
                Clic para enfocar
              </small>
            </div>

            <div
              className="card-body p-2 bus-detail-list"
              // La altura se controla desde el CSS (.bus-detail-list)
            >
              {buses.length === 0 ? (
                <div className="text-center py-5 small" style={{ color: theme.textMuted }}>
                  <FaBus size={32} className="mb-2 opacity-50 text-secondary" />
                  <p className="mb-0">No hay buses transmitiendo en este momento.</p>
                  <small>Esperando reporte de dispositivos IoT.</small>
                </div>
              ) : (
                buses.map((bus) => {
                  const isSelected = selectedBus?.id === bus.id;
                  const isOff = bus.is_offline;

                  return (
                    <div
                      key={bus.id}
                      onClick={() => setSelectedBus(bus)}
                      className="p-3 mb-2 rounded transition-all"
                      style={{
                        cursor: "pointer",
                        backgroundColor: isSelected ? theme.cardSelectedBg : theme.cardItemBg,
                        border: `1.5px solid ${isSelected ? theme.cardSelectedBorder : theme.border}`,
                        boxShadow: isSelected ? "0 2px 8px rgba(37, 99, 235, 0.25)" : "none",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <span
                            className="rounded-circle d-inline-block"
                            style={{
                              width: 10,
                              height: 10,
                              backgroundColor: isOff ? "#dc2626" : "#16a34a",
                            }}
                          />
                          <strong style={{ color: theme.textPrimary, fontSize: 14 }}>
                            {bus.alias || `Bus ${bus.id.slice(-4)}`}
                          </strong>
                        </div>
                        <div className="d-flex align-items-center gap-1">
                          <span
                            className={`badge ${
                              isOff ? "bg-danger" : "bg-success"
                            } small`}
                          >
                            {isOff ? "Offline" : "En ruta"}
                          </span>
                          {isSelected && (
                            <FaMapMarkerAlt className="text-primary ms-1" />
                          )}
                        </div>
                      </div>

                      {/* Métricas de telemetría */}
                      <div className="row g-1 small font-monospace" style={{ color: theme.textMuted }}>
                        <div className="col-6 d-flex align-items-center gap-1">
                          <FaTachometerAlt className="text-primary" />
                          <span style={{ color: theme.textPrimary }}>
                            {Number(bus.speed || bus.last_speed || 0).toFixed(1)} km/h
                          </span>
                        </div>
                        <div className="col-6 d-flex align-items-center gap-1">
                          <FaWifi className="text-success" />
                          <span>{bus.source?.toUpperCase() || "IOT"}</span>
                        </div>
                        <div className="col-12 d-flex align-items-center gap-1 mt-1 text-truncate">
                          <FaClock />
                          <span>
                            {bus.updated_at
                              ? new Date(bus.updated_at).toLocaleTimeString("es-CL")
                              : "Sin hora"}
                          </span>
                        </div>
                      </div>

                      {/* Coordenadas GPS */}
                      <div 
                        className="mt-2 pt-2 small d-flex justify-content-between font-monospace"
                        style={{ borderTop: `1px solid ${theme.border}`, color: theme.textMuted }}
                      >
                        <span>Lat: {Number(bus.lat ?? bus.last_lat).toFixed(4)}</span>
                        <span>Lon: {Number(bus.lng ?? bus.last_lng).toFixed(4)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Mapa en formato expandido */}
        <div className="col-lg-8 col-md-7">
          <div 
            className="card shadow-sm border-0 overflow-hidden bus-detail-map" 
            // La altura se controla desde el CSS (.bus-detail-map)
            style={{ 
              backgroundColor: theme.bgCard,
              border: `1px solid ${theme.border}` 
            }}
          >
            <BusMap height="100%" selectedBus={selectedBus} />
          </div>
        </div>
      </div>
    </div>
  );
}