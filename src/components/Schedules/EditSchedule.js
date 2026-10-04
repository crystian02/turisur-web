// src/components/Schedules/EditSchedule.js

import { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, InputGroup } from "react-bootstrap";
import { FaEdit, FaFilter, FaBus, FaClock, FaDollarSign, FaCalendarAlt } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function EditSchedule() {
  const [horarios, setHorarios] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  
  // Filtros
  const [filterOrigen, setFilterOrigen] = useState("");
  const [filterDestino, setFilterDestino] = useState("");

  const [formData, setFormData] = useState({
    id: "",
    origen: "",
    destino: "",
    dia: "",
    hora_salida: "",
    precio: "",
  });

  const fetchHorarios = async () => {
    try {
      const res = await fetch("/api/schedules");
      const json = await res.json();
      if (!json.error) setHorarios(json.data || []);
    } catch (e) {
      console.error("Error fetching schedules:", e);
      toast.error("Error al cargar datos");
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

  const handleSelect = (horario) => {
    setFormData(horario);
    setShowModal(true);
  };

  const handleEdit = async () => {
    if (!formData.origen || !formData.destino || !formData.dia) {
      toast.warning("Completa los campos obligatorios.");
      return;
    }

    if (formData.origen === formData.destino) {
      toast.warning("El origen y destino no pueden ser iguales");
      return;
    }

    setLoadingEdit(true);

    try {
      const res = await fetch("/api/schedules/edit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          precio: Number(formData.precio),
        }),
      });

      const json = await res.json();

      if (!json.error) {
        setShowModal(false);
        toast.success("Horario actualizado correctamente");
        fetchHorarios();
      } else {
        toast.error("Error al actualizar. Intenta nuevamente.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error de servidor.");
    }
    setLoadingEdit(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="container-fluid p-0">
      <ToastContainer position="top-center" autoClose={3000} />

      <div className="card shadow-sm border-0">
        <div className="card-header bg-primary text-white py-2">
          <h6 className="mb-0 fw-bold"><FaEdit className="me-2" /> Editar Horarios</h6>
        </div>

        <div className="card-body">
          {/* BARRA DE FILTROS */}
          <div className="row g-2 mb-3 p-2 bg-light rounded border">
            <div className="col-md-6">
              <label className="fw-bold text-muted small"><FaFilter /> Filtrar por Origen:</label>
              <select 
                className="form-select form-select-sm" 
                value={filterOrigen} 
                onChange={(e) => setFilterOrigen(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="Valdivia">Valdivia</option>
                <option value="San José">San José</option>
                <option value="Mehuin">Mehuin</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="fw-bold text-muted small"><FaFilter /> Filtrar por Destino:</label>
              <select 
                className="form-select form-select-sm" 
                value={filterDestino} 
                onChange={(e) => setFilterDestino(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="Valdivia">Valdivia</option>
                <option value="San José">San José</option>
                <option value="Mehuin">Mehuin</option>
              </select>
            </div>
          </div>

          {/* CONTENEDOR CON SCROLL INTERNO (ALTURA MÁXIMA CONTROLADA) */}
          <div 
            className="table-responsive border rounded" 
            style={{ maxHeight: "380px", overflowY: "auto" }}
          >
            <table className="table table-striped table-hover align-middle mb-0">
              <thead 
                className="table-dark text-center" 
                style={{ position: "sticky", top: 0, zIndex: 2 }}
              >
                <tr>
                  <th>Origen</th>
                  <th>Destino</th>
                  <th>Día</th>
                  <th>Hora Salida</th>
                  <th>Precio</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredHorarios.length > 0 ? (
                  filteredHorarios.map((h) => (
                    <tr key={h.id} className="text-center">
                      <td>{h.origen}</td>
                      <td>{h.destino}</td>
                      <td>{h.dia}</td>
                      <td>{h.hora_salida}</td>
                      <td>${h.precio}</td>
                      <td>
                        <Button variant="outline-primary" size="sm" onClick={() => handleSelect(h)}>
                          <FaEdit /> Editar
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-4">
                      No se encontraron horarios con estos filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL EDICIÓN */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="text-primary fw-bold fs-6">Editar Itinerario</Modal.Title>
        </Modal.Header>

        <Modal.Body className="p-3">
          <Form>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Label className="small fw-bold text-muted">Origen</Form.Label>
                <InputGroup>
                  <InputGroup.Text><FaBus /></InputGroup.Text>
                  <Form.Select 
                    name="origen" 
                    value={formData.origen} 
                    onChange={handleChange}
                  >
                     <option value="">Seleccione...</option>
                     <option value="Valdivia">Valdivia</option>
                     <option value="San José">San José</option>
                     <option value="Mehuin">Mehuin</option>
                  </Form.Select>
                </InputGroup>
              </Col>
              <Col md={6}>
                <Form.Label className="small fw-bold text-muted">Destino</Form.Label>
                <InputGroup>
                  <InputGroup.Text><FaBus /></InputGroup.Text>
                  <Form.Select 
                    name="destino" 
                    value={formData.destino} 
                    onChange={handleChange}
                  >
                     <option value="">Seleccione...</option>
                     <option value="Valdivia">Valdivia</option>
                     <option value="San José">San José</option>
                     <option value="Mehuin">Mehuin</option>
                  </Form.Select>
                </InputGroup>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">Día</Form.Label>
              <InputGroup>
                <InputGroup.Text><FaCalendarAlt /></InputGroup.Text>
                <Form.Select name="dia" value={formData.dia} onChange={handleChange}>
                   <option value="">Seleccione...</option>
                   <option value="Lunes a Viernes">Lunes a Viernes</option>
                   <option value="Sábado y Domingo">Fin de semana</option>
                   <option value="Lunes a Domingo">Todos los días</option>
                </Form.Select>
              </InputGroup>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Label className="small fw-bold text-muted">Hora Salida</Form.Label>
                <InputGroup>
                  <InputGroup.Text><FaClock /></InputGroup.Text>
                  <Form.Control type="time" name="hora_salida" value={formData.hora_salida} onChange={handleChange} />
                </InputGroup>
              </Col>
              <Col md={6}>
                <Form.Label className="small fw-bold text-muted">Precio</Form.Label>
                <InputGroup>
                  <InputGroup.Text><FaDollarSign /></InputGroup.Text>
                  <Form.Control type="number" name="precio" value={formData.precio} onChange={handleChange} />
                </InputGroup>
              </Col>
            </Row>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setShowModal(false)}>Cancelar</Button>
          <Button variant="primary" size="sm" onClick={handleEdit} disabled={loadingEdit}>
            {loadingEdit ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}