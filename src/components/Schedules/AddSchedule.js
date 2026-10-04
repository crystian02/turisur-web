// src/components/Schedules/AddSchedule.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Modal, Button, Form, Row, Col, InputGroup, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { 
  FaMapMarkerAlt, 
  FaCalendarAlt, 
  FaClock, 
  FaDollarSign, 
  FaBus, 
  FaArrowLeft 
} from "react-icons/fa";

export default function AddSchedule({ goTo }) {
  const router = useRouter();

  const initialState = {
    origen: "",
    destino: "",
    dia: "",
    hora_salida: "",
    precio: "",
  };

  const [formData, setFormData] = useState(initialState);
  const [showModal, setShowModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Retorno seguro al panel
  const handleBack = () => {
    if (typeof goTo === "function") {
      goTo("dashboard");
    } else {
      router.push("/admin?section=dashboard", undefined, { shallow: true });
    }
  };

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

  const theme = {
    bgCard: isDark ? "#18181b" : "#ffffff",
    bgSubtle: isDark ? "#27272a" : "#f4f4f5",
    border: isDark ? "#3f3f46" : "#e4e4e7",
    textPrimary: isDark ? "#f4f4f5" : "#18181b",
    textMuted: isDark ? "#a1a1aa" : "#71717a",
    inputBg: isDark ? "#27272a" : "#ffffff",
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    if (!formData.origen.trim()) return "Debe seleccionar un origen.";
    if (!formData.destino.trim()) return "Debe seleccionar un destino.";
    if (formData.origen === formData.destino) return "El origen y destino no pueden ser iguales.";
    if (!formData.dia.trim()) return "Debe seleccionar un día o frecuencia.";
    if (!formData.hora_salida.trim()) return "Debe ingresar una hora de salida.";
    
    const valorPrecio = Number(formData.precio);
    if (!formData.precio || isNaN(valorPrecio) || valorPrecio <= 0) {
      return "El precio debe ser un número mayor a cero.";
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      toast.warning(validationError); 
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/schedules/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          precio: Number(formData.precio),
        }),
      });

      const json = await res.json();

      if (!json.error) {
        toast.success("Horario agregado exitosamente.");
        setFormData(initialState);
        setErrorMsg("");
        setShowModal(false);
      } else {
        toast.error(json.error || "Error al registrar en la base de datos.");
      }
    } catch (error) {
      console.error("Error en POST /api/schedules/add:", error);
      toast.error("Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid px-0">
      {/* Barra superior con botón volver */}
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
              <FaBus className="text-primary" />
              <span>Programación de Salidas</span>
            </h5>
            <small style={{ color: theme.textMuted }}>
              Creación y alta de nuevos itinerarios para la flota
            </small>
          </div>
        </div>
      </div>

      {/* Formulario central */}
      <div className="d-flex justify-content-center">
        <div 
          className="card shadow-sm border-0" 
          style={{ 
            maxWidth: "620px", 
            width: "100%", 
            borderRadius: "12px",
            backgroundColor: theme.bgCard,
            border: `1px solid ${theme.border}`
          }}
        >
          <div 
            className="card-header bg-primary text-white text-center py-3" 
            style={{ borderTopLeftRadius: "12px", borderTopRightRadius: "12px" }}
          >
            <h5 className="mb-0 fw-bold d-flex align-items-center justify-content-center gap-2">
              <FaBus />
              <span>Nuevo Itinerario</span>
            </h5>
          </div>

          <div className="card-body p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const error = validateForm();
                if (error) {
                  setErrorMsg(error);
                } else {
                  setErrorMsg("");
                  setShowModal(true);
                }
              }}
            >
              {errorMsg && (
                <div className="alert alert-danger text-center p-2 mb-3" role="alert">
                  <small>{errorMsg}</small>
                </div>
              )}

              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold small" style={{ color: theme.textPrimary }}>
                      Origen
                    </Form.Label>
                    <InputGroup>
                      <InputGroup.Text 
                        style={{ backgroundColor: theme.bgSubtle, borderColor: theme.border, color: "#2563eb" }}
                      >
                        <FaMapMarkerAlt />
                      </InputGroup.Text>
                      <Form.Select
                        name="origen"
                        value={formData.origen}
                        onChange={handleChange}
                        style={{
                          backgroundColor: theme.inputBg,
                          color: theme.textPrimary,
                          borderColor: theme.border,
                        }}
                      >
                        <option value="">Seleccione...</option>
                        <option value="Valdivia">Valdivia</option>
                        <option value="San José">San José</option>
                        <option value="Mehuin">Mehuin</option>
                      </Form.Select>
                    </InputGroup>
                  </Form.Group>
                </Col>
                
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold small" style={{ color: theme.textPrimary }}>
                      Destino
                    </Form.Label>
                    <InputGroup>
                      <InputGroup.Text 
                        style={{ backgroundColor: theme.bgSubtle, borderColor: theme.border, color: "#dc2626" }}
                      >
                        <FaMapMarkerAlt />
                      </InputGroup.Text>
                      <Form.Select
                        name="destino"
                        value={formData.destino}
                        onChange={handleChange}
                        style={{
                          backgroundColor: theme.inputBg,
                          color: theme.textPrimary,
                          borderColor: theme.border,
                        }}
                      >
                        <option value="">Seleccione...</option>
                        <option value="Valdivia">Valdivia</option>
                        <option value="San José">San José</option>
                        <option value="Mehuin">Mehuin</option>
                      </Form.Select>
                    </InputGroup>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label className="fw-bold small" style={{ color: theme.textPrimary }}>
                  Frecuencia (Días)
                </Form.Label>
                <InputGroup>
                  <InputGroup.Text 
                    style={{ backgroundColor: theme.bgSubtle, borderColor: theme.border, color: theme.textPrimary }}
                  >
                    <FaCalendarAlt />
                  </InputGroup.Text>
                  <Form.Select
                    name="dia"
                    value={formData.dia}
                    onChange={handleChange}
                    style={{
                      backgroundColor: theme.inputBg,
                      color: theme.textPrimary,
                      borderColor: theme.border,
                    }}
                  >
                    <option value="">Seleccione una opción...</option>
                    <option value="Lunes a Viernes">Lunes a Viernes</option>
                    <option value="Sábado y Domingo">Fin de semana</option>
                    <option value="Lunes a Domingo">Todos los días</option>
                  </Form.Select>
                </InputGroup>
              </Form.Group>

              <Row className="mb-4">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold small" style={{ color: theme.textPrimary }}>
                      Hora de Salida
                    </Form.Label>
                    <InputGroup>
                      <InputGroup.Text 
                        style={{ backgroundColor: theme.bgSubtle, borderColor: theme.border, color: theme.textPrimary }}
                      >
                        <FaClock />
                      </InputGroup.Text>
                      <Form.Control
                        type="time"
                        name="hora_salida"
                        value={formData.hora_salida}
                        onChange={handleChange}
                        style={{
                          backgroundColor: theme.inputBg,
                          color: theme.textPrimary,
                          borderColor: theme.border,
                        }}
                      />
                    </InputGroup>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold small" style={{ color: theme.textPrimary }}>
                      Precio Boleto (CLP)
                    </Form.Label>
                    <InputGroup>
                      <InputGroup.Text 
                        style={{ backgroundColor: theme.bgSubtle, borderColor: theme.border, color: "#16a34a" }}
                      >
                        <FaDollarSign />
                      </InputGroup.Text>
                      <Form.Control
                        type="number"
                        name="precio"
                        min="1"
                        step="50"
                        value={formData.precio}
                        onChange={handleChange}
                        placeholder="0"
                        style={{
                          backgroundColor: theme.inputBg,
                          color: theme.textPrimary,
                          borderColor: theme.border,
                        }}
                      />
                    </InputGroup>
                  </Form.Group>
                </Col>
              </Row>

              <Button 
                className="w-100 py-2 fw-bold shadow-sm" 
                variant="success" 
                type="submit"
              >
                Guardar Horario
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Modal de confirmación adaptado a tema */}
      <Modal show={showModal} onHide={() => !loading && setShowModal(false)} centered>
        <div style={{ backgroundColor: theme.bgCard, color: theme.textPrimary, borderRadius: 8, border: `1px solid ${theme.border}` }}>
          <Modal.Header closeButton={!loading} style={{ borderBottom: `1px solid ${theme.border}` }}>
            <Modal.Title className="text-primary fw-bold fs-6">Confirmar Ingreso</Modal.Title>
          </Modal.Header>

          <Modal.Body className="p-4">
            <div 
              className="p-3 rounded mb-3" 
              style={{ backgroundColor: theme.bgSubtle, border: `1px solid ${theme.border}` }}
            >
              <h6 className="fw-bold mb-3" style={{ color: theme.textPrimary }}>Resumen del itinerario:</h6>
              <div className="d-flex justify-content-between mb-2 small">
                <span style={{ color: theme.textMuted }}>Ruta:</span>
                <strong>{formData.origen} &rarr; {formData.destino}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2 small">
                <span style={{ color: theme.textMuted }}>Frecuencia:</span>
                <strong>{formData.dia}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2 small">
                <span style={{ color: theme.textMuted }}>Horario:</span>
                <strong>{formData.hora_salida} hrs</strong>
              </div>
              <div className="d-flex justify-content-between small">
                <span style={{ color: theme.textMuted }}>Tarifa:</span>
                <strong className="text-success">${Number(formData.precio || 0).toLocaleString("es-CL")} CLP</strong>
              </div>
            </div>
            <p className="text-center small mb-0" style={{ color: theme.textMuted }}>
              ¿Confirmas registrar este nuevo itinerario en el sistema?
            </p>
          </Modal.Body>

          <Modal.Footer style={{ borderTop: `1px solid ${theme.border}`, justifyContent: "center" }}>
            <Button 
              variant="outline-secondary" 
              disabled={loading} 
              onClick={() => setShowModal(false)} 
              className="px-4"
            >
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              disabled={loading} 
              onClick={handleSubmit} 
              className="px-4"
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Guardando...
                </>
              ) : (
                "Confirmar y Guardar"
              )}
            </Button>
          </Modal.Footer>
        </div>
      </Modal>
    </div>
  );
}