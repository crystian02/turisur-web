// src/components/Comments/ListComments.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Modal, Button, Form, Spinner } from "react-bootstrap";
import { 
  FaCommentDots, 
  FaFilter, 
  FaReply, 
  FaEdit, 
  FaArrowLeft, 
  FaCheckCircle, 
  FaClock, 
  FaEnvelope, 
  FaTag,
  FaInbox,
  FaLayerGroup,
  FaExclamationTriangle,
  FaLightbulb,
  FaSuitcase,
  FaBug
} from "react-icons/fa";
import { toast } from "react-toastify";

export default function ListComments({ goTo, mini = false }) {
  const router = useRouter();
  const [comentarios, setComentarios] = useState([]);
  const [filtro, setFiltro] = useState("Todos");
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [selectedComment, setSelectedComment] = useState(null);
  const [responseText, setResponseText] = useState("");
  const [sending, setSending] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Detección reactiva de modo oscuro
  useEffect(() => {
    const checkDark = () => {
      setIsDark(document.body.classList.contains("admin-dark"));
    };
    checkDark();

    const observer = new MutationObserver(checkDark);
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const handleBack = () => {
    if (typeof goTo === "function") {
      goTo("dashboard");
    } else {
      router.push("/admin?section=dashboard", undefined, { shallow: true });
    }
  };

  const theme = {
    bgCard: isDark ? "#18181b" : "#ffffff",
    bgSubtle: isDark ? "#27272a" : "#f8fafc",
    border: isDark ? "#3f3f46" : "#e2e8f0",
    textPrimary: isDark ? "#f4f4f5" : "#0f172a",
    textMuted: isDark ? "#a1a1aa" : "#64748b",
  };

  const fetchComentarios = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/comments");
      const json = await res.json();
      if (!json.error && Array.isArray(json.data)) {
        setComentarios(json.data);
      }
    } catch (err) {
      console.error("Error al obtener comentarios:", err);
      toast.error("Error al cargar comentarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComentarios();
  }, []);

  const normalize = (txt = "") =>
    txt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  const comentariosFiltrados = comentarios.filter((c) =>
    filtro === "Todos" ? true : normalize(c.tipo) === normalize(filtro)
  );

  const pendientesCount = comentarios.filter((c) => !c.respuesta).length;
  const respondidosCount = comentarios.filter((c) => !!c.respuesta).length;

  // ==========================================================
  // CATEGORÍAS CON ÍCONOS
  // Cada tarjeta muestra un ícono, un label y el conteo.
  // Solo se usa en la vista completa (mini = false).
  // ==========================================================
  const categorias = [
    {
      key: "Todos",
      label: "Todos",
      icon: FaLayerGroup,
      color: "#3b82f6",
      bg: "rgba(59, 130, 246, 0.15)",
    },
    {
      key: "Reclamo",
      label: "Reclamos",
      icon: FaExclamationTriangle,
      color: "#ef4444",
      bg: "rgba(239, 68, 68, 0.15)",
    },
    {
      key: "Sugerencia",
      label: "Sugerencias",
      icon: FaLightbulb,
      color: "#22c55e",
      bg: "rgba(34, 197, 94, 0.15)",
    },
    {
      key: "Objeto perdido",
      label: "Objetos perdidos",
      icon: FaSuitcase,
      color: "#eab308",
      bg: "rgba(234, 179, 8, 0.15)",
    },
    {
      key: "Error en la aplicación",
      label: "Reportes app",
      icon: FaBug,
      color: "#8b5cf6",
      bg: "rgba(139, 92, 246, 0.15)",
    },
  ];

  // Cuenta cuántos comentarios hay en cada categoría
  const countByCategory = (key) => {
    if (key === "Todos") return comentarios.length;
    return comentarios.filter((c) => normalize(c.tipo) === normalize(key)).length;
  };

  const openModal = (c) => {
    setSelectedComment(c);
    setResponseText(c.respuesta || "");
    setShowModal(true);
  };

  const sendReply = async () => {
    if (!selectedComment || !responseText.trim()) return;

    setSending(true);
    try {
      const res = await fetch("/api/comments/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: selectedComment.id, 
          respuesta: responseText.trim(),
          fecha_respuesta: new Date().toISOString()
        }),
      });

      const json = await res.json();

      if (res.ok && !json.error) {
        toast.success("Respuesta registrada con éxito");
        await fetchComentarios();
        setShowModal(false);
      } else {
        toast.error(json.message || "No se pudo guardar la respuesta");
      }
    } catch (err) {
      console.error("Error al responder comentario:", err);
      toast.error("Error de conexión al enviar respuesta");
    } finally {
      setSending(false);
    }
  };

  const getBadgeStyle = (tipo) => {
    const t = normalize(tipo);
    if (t.includes("reclamo")) return { bg: "rgba(239, 68, 68, 0.15)", text: "#ef4444", border: "rgba(239, 68, 68, 0.3)" };
    if (t.includes("sugerencia")) return { bg: "rgba(34, 197, 94, 0.15)", text: "#22c55e", border: "rgba(34, 197, 94, 0.3)" };
    if (t.includes("perdido")) return { bg: "rgba(234, 179, 8, 0.15)", text: "#eab308", border: "rgba(234, 179, 8, 0.3)" };
    if (t.includes("error")) return { bg: "rgba(139, 92, 246, 0.15)", text: "#8b5cf6", border: "rgba(139, 92, 246, 0.3)" };
    return { bg: "rgba(59, 130, 246, 0.15)", text: "#3b82f6", border: "rgba(59, 130, 246, 0.3)" };
  };

  return (
    <div className="w-100 comments-container">
      {/* ==========================================================
          HEADER CON BOTÓN "VOLVER AL DASHBOARD"
          Se muestra solo en la vista completa (mini = false).
          ========================================================== */}
      {!mini && (
        <div 
          className="mb-4 p-3 rounded shadow-sm comments-header"
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
                <FaCommentDots className="text-primary" />
                <span>Atención a Pasajeros y Consultas</span>
              </h5>
              <small style={{ color: theme.textMuted }}>
                Buzón de reclamos, sugerencias y objetos extraviados
              </small>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span 
              className="badge px-3 py-2 font-monospace"
              style={{ 
                backgroundColor: isDark ? "rgba(234, 179, 8, 0.15)" : "#fef9c3", 
                color: "#ca8a04",
                border: "1px solid rgba(234, 179, 8, 0.3)"
              }}
            >
              <FaClock className="me-1" /> {pendientesCount} pendientes
            </span>
            <span 
              className="badge px-3 py-2 font-monospace"
              style={{ 
                backgroundColor: isDark ? "rgba(34, 197, 94, 0.15)" : "#dcfce7", 
                color: "#16a34a",
                border: "1px solid rgba(34, 197, 94, 0.3)"
              }}
            >
              <FaCheckCircle className="me-1" /> {respondidosCount} resueltos
            </span>
          </div>
        </div>
      )}

      {/* ==========================================================
          FILTROS: DOS MODOS SEGÚN mini
          - mini = false (vista completa): tarjetas con íconos y conteo
          - mini = true (dashboard): <select> clásico
          ========================================================== */}
      {!mini ? (
        <>
          {/* MODO VISTA COMPLETA: tarjetas con íconos */}
          <div className="comments-category-grid">
            {categorias.map((cat) => {
              const Icon = cat.icon;
              const isActive = filtro === cat.key;
              const count = countByCategory(cat.key);

              return (
                <button
                  key={cat.key}
                  type="button"
                  className={`comment-category-card ${isActive ? "active" : ""}`}
                  onClick={() => setFiltro(cat.key)}
                  style={{
                    backgroundColor: isActive ? cat.bg : theme.bgCard,
                    borderColor: isActive ? cat.color : theme.border,
                    color: isActive ? cat.color : theme.textPrimary,
                  }}
                >
                  <span 
                    className="category-icon"
                    style={{
                      backgroundColor: cat.bg,
                      color: cat.color,
                    }}
                  >
                    <Icon size={14} />
                  </span>
                  <span className="category-label">{cat.label}</span>
                  <span 
                    className="category-count"
                    style={{
                      backgroundColor: isActive ? cat.color : theme.bgSubtle,
                      color: isActive ? "#ffffff" : theme.textMuted,
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Barra de contadores (solo en modo completo) */}
          <div className="comments-counter-bar mb-3 small font-monospace" style={{ color: theme.textMuted }}>
            Mostrando <strong>{comentariosFiltrados.length}</strong> mensajes
            {filtro !== "Todos" && (
              <> de la categoría <strong>{filtro}</strong></>
            )}
          </div>
        </>
      ) : (
        /* MODO DASHBOARD EMBEBIDO: <select> clásico */
        <div 
          className="mb-3 p-2 rounded"
          style={{ backgroundColor: theme.bgSubtle, border: `1px solid ${theme.border}` }}
        >
          <div className="d-flex justify-content-between align-items-center gap-2">
            <div style={{ maxWidth: 280, width: "100%" }}>
              <div className="input-group input-group-sm">
                <span 
                  className="input-group-text" 
                  style={{ backgroundColor: theme.bgCard, borderColor: theme.border, color: theme.textMuted }}
                >
                  <FaFilter size={11} />
                </span>
                <select
                  className="form-select form-select-sm"
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  style={{
                    backgroundColor: theme.bgCard,
                    color: theme.textPrimary,
                    borderColor: theme.border,
                  }}
                >
                  <option value="Todos">Todas las categorías</option>
                  <option value="Reclamo">Reclamos</option>
                  <option value="Sugerencia">Sugerencias</option>
                  <option value="Objeto perdido">Objetos perdidos</option>
                  <option value="Error en la aplicación">Reportes de la app</option>
                </select>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2 small font-monospace">
              <span style={{ color: theme.textMuted }}>Total: {comentariosFiltrados.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Lista tipo Feed */}
      <div 
        className="comments-list"
        style={{ 
          maxHeight: mini ? 480 : "70vh", 
          overflowY: "auto", 
          paddingRight: 4 
        }}
      >
        {loading ? (
          <div className="text-center py-5" style={{ color: theme.textMuted }}>
            <Spinner size="sm" className="me-2" /> Cargando comentarios...
          </div>
        ) : comentariosFiltrados.length === 0 ? (
          <div 
            className="text-center py-5 rounded p-4" 
            style={{ backgroundColor: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.textMuted }}
          >
            <FaInbox size={32} className="mb-2 opacity-50" />
            <p className="mb-0">No hay mensajes registrados en esta categoría.</p>
          </div>
        ) : (
          comentariosFiltrados.map((c) => {
            const badge = getBadgeStyle(c.tipo);
            const isResolved = !!c.respuesta;

            return (
              <div 
                key={c.id}
                className="mb-2 shadow-sm comment-card"
                style={{
                  backgroundColor: theme.bgCard,
                  border: `1px solid ${theme.border}`,
                  borderLeft: `4px solid ${isResolved ? "#22c55e" : "#eab308"}`,
                }}
              >
                <div className="mb-2 comment-card-header">
                  <div className="comment-card-meta">
                    <span 
                      className="badge px-2 py-1"
                      style={{
                        backgroundColor: badge.bg,
                        color: badge.text,
                        border: `1px solid ${badge.border}`,
                        fontSize: 11
                      }}
                    >
                      <FaTag size={9} className="me-1" />
                      {c.tipo}
                    </span>

                    <span className="small font-monospace d-flex align-items-center gap-1" style={{ color: theme.textMuted }}>
                      <FaEnvelope size={11} /> {c.correo_electronico}
                    </span>

                    <span className="small" style={{ color: theme.textMuted }}>•</span>

                    <span className="small font-monospace" style={{ color: theme.textMuted }}>
                      {new Date(c.created_at).toLocaleDateString("es-CL", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="comment-card-actions">
                    <span 
                      className="badge px-2 py-1 font-monospace"
                      style={{
                        backgroundColor: isResolved 
                          ? (isDark ? "rgba(34, 197, 94, 0.15)" : "#dcfce7")
                          : (isDark ? "rgba(234, 179, 8, 0.15)" : "#fef9c3"),
                        color: isResolved ? "#16a34a" : "#ca8a04",
                        border: `1px solid ${isResolved ? "rgba(34, 197, 94, 0.3)" : "rgba(234, 179, 8, 0.3)"}`,
                      }}
                    >
                      {isResolved ? "Respondido" : "Pendiente"}
                    </span>

                    <Button
                      variant={isResolved ? "outline-secondary" : "outline-primary"}
                      size="sm"
                      className="d-inline-flex align-items-center gap-1 py-1 px-2"
                      style={{ fontSize: 11 }}
                      onClick={() => openModal(c)}
                    >
                      {isResolved ? <><FaEdit size={10} /> Editar</> : <><FaReply size={10} /> Responder</>}
                    </Button>
                  </div>
                </div>

                <div 
                  className="p-2.5 rounded my-2" 
                  style={{ 
                    backgroundColor: theme.bgSubtle, 
                    color: theme.textPrimary,
                    fontSize: 13.5,
                    lineHeight: 1.5
                  }}
                >
                  {c.comentario}
                </div>

                {c.respuesta && (
                  <div 
                    className="p-2.5 rounded mt-2 small"
                    style={{ 
                      backgroundColor: isDark ? "rgba(34, 197, 94, 0.08)" : "#f0fdf4", 
                      borderLeft: "3px solid #22c55e",
                      color: theme.textPrimary,
                      fontSize: 12.5
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <strong className="text-success small">Respuesta oficial de Buses Turisur:</strong>
                      {c.fecha_respuesta && (
                        <span className="small text-muted font-monospace" style={{ fontSize: 10.5 }}>
                          {new Date(c.fecha_respuesta).toLocaleDateString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </div>
                    <div style={{ color: isDark ? "#e4e4e7" : "#334155" }}>
                      {c.respuesta}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal para responder */}
      <Modal show={showModal} onHide={() => !sending && setShowModal(false)} centered>
        <div style={{ backgroundColor: theme.bgCard, color: theme.textPrimary, borderRadius: 8, border: `1px solid ${theme.border}` }}>
          <Modal.Header closeButton={!sending} style={{ borderBottom: `1px solid ${theme.border}` }}>
            <Modal.Title className="fs-6 fw-bold text-primary d-flex align-items-center gap-2">
              <FaReply />
              <span>{selectedComment?.respuesta ? "Modificar Respuesta" : "Responder Consulta"}</span>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            <div className="mb-3">
              <span className="small fw-bold" style={{ color: theme.textMuted }}>Mensaje recibido:</span>
              <div 
                className="rounded p-3 small mt-1" 
                style={{ backgroundColor: theme.bgSubtle, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
              >
                <div className="mb-1 text-muted" style={{ fontSize: 11 }}>
                  De: <strong>{selectedComment?.correo_electronico}</strong> • Tipo: <strong>{selectedComment?.tipo}</strong>
                </div>
                <div className="fst-italic">"{selectedComment?.comentario}"</div>
              </div>
            </div>
            
            <div className="mb-1 mt-3">
              <label className="form-label small fw-bold" style={{ color: theme.textPrimary }}>
                Redactar respuesta administrativa:
              </label>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Escribe la respuesta al pasajero..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                style={{
                  backgroundColor: theme.bgSubtle,
                  color: theme.textPrimary,
                  borderColor: theme.border,
                }}
              />
            </div>
          </Modal.Body>
          <Modal.Footer style={{ borderTop: `1px solid ${theme.border}` }}>
            <Button
              variant="outline-secondary"
              size="sm"
              disabled={sending}
              onClick={() => setShowModal(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={sendReply}
              disabled={sending || !responseText.trim()}
            >
              {sending ? (
                <>
                  <Spinner size="sm" className="me-1" />
                  Guardando...
                </>
              ) : (
                "Guardar Respuesta"
              )}
            </Button>
          </Modal.Footer>
        </div>
      </Modal>
    </div>
  );
}