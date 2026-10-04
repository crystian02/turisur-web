import { 
  FaMapMarkedAlt, 
  FaChartLine, 
  FaCreditCard, 
  FaClock, 
  FaPlus, 
  FaTrashAlt, 
  FaComments 
} from "react-icons/fa";

import BusMap from "../Buses/BusMap";
import RevenueDashboard from "../Reports/RevenueDashboard";
import ListPayments from "../payments/ListPayments";
import EditSchedule from "../Schedules/EditSchedule";
import ListComentarios from "../Comments/ListComments";

export default function AdminDashboard({ goTo }) {
  return (
    <div className="container-fluid p-0">

      {/* Fila superior: mapa satelital y resumen de recaudación */}
      <div className="row mb-4">
        <div className="col-xl-6 col-lg-12 mb-3">
          <div className="card shadow-sm h-100">
            <div className="card-body d-flex flex-column">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                  <FaMapMarkedAlt className="text-primary" />
                  <span>Buses en tiempo real</span>
                </h6>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => goTo("map")}
                >
                  Ver más
                </button>
              </div>
              <div style={{ height: 280, minHeight: 280, width: "100%", position: "relative" }}>
                <BusMap height="100%" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-6 col-lg-12 mb-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                  <FaChartLine className="text-success" />
                  <span>Ingresos</span>
                </h6>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => goTo("revenue")}
                >
                  Ver más
                </button>
              </div>
              <RevenueDashboard mini />
            </div>
          </div>
        </div>
      </div>

      {/* Historial reciente de pagos */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
              <FaCreditCard className="text-secondary" />
              <span>Pagos recientes</span>
            </h6>
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              onClick={() => goTo("payments")}
            >
              Ver todos
            </button>
          </div>
          <ListPayments mini />
        </div>
      </div>

      {/* Gestión de horarios */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
              <FaClock className="text-info" />
              <span>Gestión de horarios</span>
            </h6>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-success btn-sm d-flex align-items-center gap-1"
                onClick={() => goTo("add")}
              >
                <FaPlus size={11} />
                <span>Agregar</span>
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm d-flex align-items-center gap-1"
                onClick={() => goTo("delete")}
              >
                <FaTrashAlt size={11} />
                <span>Eliminar</span>
              </button>
            </div>
          </div>
          <EditSchedule />
        </div>
      </div>

      {/* Comentarios */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
              <FaComments className="text-primary" />
              <span>Comentarios</span>
            </h6>
            {/* "Ver más" para abrir la vista completa de comentarios */}
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              onClick={() => goTo("comments")}
            >
              Ver más
            </button>
          </div>
          <div style={{ maxHeight: 420, overflowY: "auto" }}>
            {/* CAMBIO: mini para que se renderice en modo reducido
                (sin header, sin botón "Volver al Dashboard") */}
            <ListComentarios mini />
          </div>
        </div>
      </div>

    </div>
  );
}