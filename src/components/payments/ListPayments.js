// src/components/payments/ListPayments.js
import { useEffect, useState, useCallback } from "react";
import { FaCreditCard } from "react-icons/fa";

export default function ListPayments({ mini = false }) {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Consulta de transacciones procesadas por la pasarela Webpay
  const fetchPagos = useCallback(async () => {
    try {
      const res = await fetch("/api/payments");
      const json = await res.json();

      if (!json.error && Array.isArray(json.data)) {
        // En vista reducida limitamos a las 5 compras mas recientes para no estirar el dashboard
        setPagos(mini ? json.data.slice(0, 5) : json.data);
      }
    } catch (err) {
      console.error("Error al consultar transacciones de pago:", err);
    } finally {
      setLoading(false);
    }
  }, [mini]);

  useEffect(() => {
    fetchPagos();

    // En la vista completa actualizamos cada 10s para monitorear autorizaciones en tiempo real
    if (!mini) {
      const interval = setInterval(fetchPagos, 10000);
      return () => clearInterval(interval);
    }
  }, [fetchPagos, mini]);

  const formatDate = (str) => {
    if (!str) return "-";
    return new Date(str).toLocaleString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatAmount = (n) => {
    if (n == null || isNaN(n)) return "-";
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n);
  };

  // Mapeo visual segun el estado retornado por Transbank / Supabase
  const renderStatusBadge = (status = "") => {
    const s = status.toLowerCase();

    if (s === "authorized" || s === "approved") {
      return (
        <span className="badge bg-success-subtle text-success border border-success-subtle">
          Aprobado
        </span>
      );
    }
    if (s === "pending") {
      return (
        <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">
          Pendiente
        </span>
      );
    }
    return (
      <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
        Rechazado
      </span>
    );
  };

  const tableContent = (
    <div className="table-responsive border rounded" style={{ maxHeight: mini ? 300 : 540, overflowY: "auto" }}>
      <table className="table table-sm table-striped table-hover align-middle text-center mb-0" style={{ fontSize: 13 }}>
        <thead className="table-dark sticky-top" style={{ zIndex: 2 }}>
          <tr>
            <th style={{ width: 180 }}>Fecha</th>
            <th style={{ width: 120 }}>Monto</th>
            <th style={{ width: 110 }}>Estado</th>
            {!mini && <th>Orden de Compra</th>}
            {!mini && <th>Tarjeta</th>}
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan={mini ? 3 : 5} className="py-4 text-muted">
                <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
                Cargando registros...
              </td>
            </tr>
          ) : pagos.length > 0 ? (
            pagos.map((p) => (
              <tr key={p.id}>
                <td className="text-muted small">{formatDate(p.transaction_date || p.created_at)}</td>
                <td className="fw-semibold text-dark">{formatAmount(p.amount_clp)}</td>
                <td>{renderStatusBadge(p.status)}</td>

                {!mini && <td className="text-secondary font-monospace small">{p.buy_order || "-"}</td>}
                {!mini && (
                  <td className="text-muted small">
                    {p.card_last4 ? `•••• •••• •••• ${p.card_last4}` : "-"}
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={mini ? 3 : 5} className="py-4 text-muted">
                No hay transacciones registradas.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  // Vista compacta para incrustar dentro de la card del dashboard
  if (mini) {
    return tableContent;
  }

  // Vista completa cuando se ingresa desde la seccion /admin?section=payments
  return (
    <div className="container mt-4">
      <div className="card shadow-sm border-0">
        <div className="card-header bg-primary text-white py-2 d-flex align-items-center gap-2">
          <FaCreditCard size={15} />
          <h6 className="mb-0 fw-bold">Registro de Pagos Webpay Plus</h6>
        </div>

        <div className="card-body">
          {tableContent}
        </div>
      </div>
    </div>
  );
}