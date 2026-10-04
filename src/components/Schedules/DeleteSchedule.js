// src/components/Schedules/DeleteSchedule.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Button, Modal, Spinner } from "react-bootstrap";
import { FaTrashAlt, FaFilter, FaArrowLeft, FaCalendarAlt } from "react-icons/fa";
import { toast } from "react-toastify";

export default function DeleteSchedule({ goTo }) {
  const router = useRouter();
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDark, setIsDark] = useState(false);

  const [filterOrigen, setFilterOrigen] = useState("");
  const [filterDestino, setFilterDestino] = useState("");

  const handleBack = () => {
    if (typeof goTo === "function") {
      goTo("dashboard");
    } else {
      router.push("/admin?section=dashboard", undefined, { shallow: true });
    }
  };

  useEffect(() => {
    const checkDark = () => {
      setIsDark(document.body.classList.contains("admin-dark"));
    };
    checkDark();

    const observer = new MutationObserver(checkDark);
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const theme = {
    bgCard: isDark ? "#18181b" : "#ffffff",
    bgSubtle: isDark ? "#27272a" : "#f4f4f5",
    border: isDark ? "#3f3f46" : "#e4e4e7",
    textPrimary: isDark ? "#f4f4f5" : "#18181b",
    textMuted: isDark ? "#a1a1aa" : "#71717a",
    tableRowHover: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
  };

  const fetchHorarios = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/schedules");
      const json = await res.json();
      if (!json.error) setHorarios(json.data || []);
    } catch (e) {
      console.error(e);
      toast.error("Error al cargar horarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHorarios();
  }, []);

  const filteredHorarios = horarios.filter((h) => {
    const matchOrigen = filterOrigen === "" || h.origen === filterOrigen;
    const matchDestino = filterDestino === "" || h.destino === filterDestino;
    return matchOrigen && matchDestino;
  });

  const confirmDelete = async () => {
    if (!itemToDelete?.id) return;
    setDeletingId(itemToDelete.id);

    try {
      const res = await fetch("/api/schedules/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: itemToDelete.id }),
      });
      const json = await res.json();

      if (!json.error) {
        toast.success("Horario eliminado exitosamente");
        setItemToDelete(null);
        fetchHorarios();
      } else {
        toast.error(json.error || "No se pudo eliminar el horario");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error de servidor");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="container-fluid px-0">
      {/* Barra superior con volver */}
      <div 
        className="d-flex align-items-center justify-content-between mb-4 p-3 rounded shadow-sm"
        style={{
          backgroundColor: theme.bgCard,
          border: `1px solid ${theme.border}`,
          color: theme.textPrimary,
        }}
      >
        <div className="d-flex align-items-center gap-3">
          <button
            type="button"
            className="btn btn-sm d-flex align-items-center gap-2 fw-semibold"
            style={{
              backgroundColor: theme.bgSubtle,
              color: theme.textPrimary,
              border: `1px solid ${theme.border}`,
            }}
            onClick={handleBack}
          >
            <FaArrowLeft />
            <span>Volver al Dashboard</span>
          </button>
          <div>
            <h5 className="mb-0 fw-bold d-flex align-items-center gap-2" style={{ color: theme.textPrimary }}>
              <FaTrashAlt className="text-danger" />
              <span>Eliminar Salidas de Horarios</span>
            </h5>
            <small style={{ color: theme.textMuted }}>
              Gestiona y da de baja itinerarios del sistema
            </small>
          </div>
        </div>

        <span className="badge bg-danger px-3 py-2 fs-6 font-monospace">
          {horarios.length} registrados
        </span>
      </div>

      <div 
        className="card shadow-sm border-0 rounded"
        style={{ backgroundColor: theme.bgCard, border: `1px solid ${theme.border}` }}
      >
        <div className="card-header bg-danger text-white py-2 d-flex justify-content-between align-items-center">
          <h6 className="mb-0 fw-bold d-flex align-items-center gap-2">
            <FaTrashAlt />
            <span>Catálogo de Salidas</span>
          </h6>
          <small className="font-monospace">Total filtrados: {filteredHorarios.length}</small>
        </div>

        <div className="card-body p-3">
          {/* Barra de Filtros con tema adaptado */}
          <div 
            className="row g-2 mb-3 p-2 rounded"
            style={{ backgroundColor: theme.bgSubtle, border: `1px solid ${theme.border}` }}
          >
            <div className="col-md-6">
              <label className="fw-bold small d-flex align-items-center gap-1 mb-1" style={{ color: theme.textPrimary }}>
                <FaFilter size={11} className="text-danger" />
                <span>Filtrar por Origen:</span>
              </label>
              <select 
                className="form-select form-select-sm" 
                value={filterOrigen} 
                onChange={(e) => setFilterOrigen(e.target.value)}
                style={{
                  backgroundColor: theme.bgCard,
                  color: theme.textPrimary,
                  borderColor: theme.border,
                }}
              >
                <option value="">Todos</option>
                <option value="Valdivia">Valdivia</option>
                <option value="San José">San José</option>
                <option value="Mehuin">Mehuin</option>
              </select>
            </div>

            <div className="col-md-6">
              <label className="fw-bold small d-flex align-items-center gap-1 mb-1" style={{ color: theme.textPrimary }}>
                <FaFilter size={11} className="text-danger" />
                <span>Filtrar por Destino:</span>
              </label>
              <select 
                className="form-select form-select-sm" 
                value={filterDestino} 
                onChange={(e) => setFilterDestino(e.target.value)}
                style={{
                  backgroundColor: theme.bgCard,
                  color: theme.textPrimary,
                  borderColor: theme.border,
                }}
              >
                <option value="">Todos</option>
                <option value="Valdivia">Valdivia</option>
                <option value="San José">San José</option>
                <option value="Mehuin">Mehuin</option>
              </select>
            </div>
          </div>

          {/* Tabla de horarios */}
          <div 
            className="table-responsive rounded" 
            style={{ maxHeight: "480px", overflowY: "auto", border: `1px solid ${theme.border}` }}
          >
            <table className="table align-middle mb-0" style={{ color: theme.textPrimary }}>
              <thead 
                style={{ 
                  position: "sticky", 
                  top: 0, 
                  zIndex: 2, 
                  backgroundColor: isDark ? "#27272a" : "#0f172a",
                  color: "#ffffff"
                }}
              >
                <tr className="text-center small">
                  <th className="py-2">Origen</th>
                  <th className="py-2">Destino</th>
                  <th className="py-2">Día</th>
                  <th className="py-2">Hora Salida</th>
                  <th className="py-2">Precio</th>
                  <th className="py-2">Acción</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4" style={{ color: theme.textMuted }}>
                      <Spinner size="sm" className="me-2" /> Cargando catálogo de horarios...
                    </td>
                  </tr>
                ) : filteredHorarios.length > 0 ? (
                  filteredHorarios.map((h) => (
                    <tr 
                      key={h.id} 
                      className="text-center small"
                      style={{ borderBottom: `1px solid ${theme.border}` }}
                    >
                      <td className="fw-semibold">{h.origen}</td>
                      <td className="fw-semibold">{h.destino}</td>
                      <td style={{ color: theme.textMuted }}>{h.dia}</td>
                      <td className="fw-bold font-monospace">{h.hora_salida} hrs</td>
                      <td className="text-success fw-bold font-monospace">${Number(h.precio).toLocaleString("es-CL")}</td>
                      <td>
                        <Button 
                          variant="outline-danger" 
                          size="sm" 
                          onClick={() => setItemToDelete(h)}
                        >
                          <FaTrashAlt />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-4" style={{ color: theme.textMuted }}>
                      No se encontraron horarios para los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de confirmación para eliminar */}
      <Modal show={!!itemToDelete} onHide={() => !deletingId && setItemToDelete(null)} centered>
        <div style={{ backgroundColor: theme.bgCard, color: theme.textPrimary, borderRadius: 8, border: `1px solid ${theme.border}` }}>
          <Modal.Header closeButton={!deletingId} style={{ borderBottom: `1px solid ${theme.border}` }}>
            <Modal.Title className="text-danger fw-bold fs-6">Confirmar Eliminación</Modal.Title>
          </Modal.Header>

          <Modal.Body className="p-4">
            <p className="mb-2">¿Estás seguro de que deseas eliminar este horario de forma permanente?</p>
            {itemToDelete && (
              <div 
                className="p-3 rounded small" 
                style={{ backgroundColor: theme.bgSubtle, border: `1px solid ${theme.border}` }}
              >
                <div><strong>Ruta:</strong> {itemToDelete.origen} &rarr; {itemToDelete.destino}</div>
                <div><strong>Hora:</strong> {itemToDelete.hora_salida} hrs ({itemToDelete.dia})</div>
                <div><strong>Tarifa:</strong> ${Number(itemToDelete.precio).toLocaleString("es-CL")} CLP</div>
              </div>
            )}
          </Modal.Body>

          <Modal.Footer style={{ borderTop: `1px solid ${theme.border}` }}>
            <Button 
              variant="outline-secondary" 
              size="sm"
              disabled={!!deletingId} 
              onClick={() => setItemToDelete(null)}
            >
              Cancelar
            </Button>
            <Button 
              variant="danger" 
              size="sm"
              disabled={!!deletingId} 
              onClick={confirmDelete}
            >
              {deletingId ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Eliminando...
                </>
              ) : (
                "Eliminar Salida"
              )}
            </Button>
          </Modal.Footer>
        </div>
      </Modal>
    </div>
  );
}