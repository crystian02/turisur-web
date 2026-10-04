// src/components/Reports/RevenueDashboard.js
"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { format, startOfWeek, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { 
  FaChartBar, 
  FaCalendarCheck, 
  FaArrowLeft, 
  FaMoneyBillWave, 
  FaTicketAlt, 
  FaReceipt, 
  FaTrophy 
} from "react-icons/fa";

// Registro modular de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function RevenueDashboard({ mini = false, goTo }) {
  const router = useRouter();
  const [payments, setPayments] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [viewMode, setViewMode] = useState("day"); // "day" | "week" | "month"
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [maxRecord, setMaxRecord] = useState({ label: "-", amount: 0 });
  const [isDark, setIsDark] = useState(false);

  // Botón volver compatible aunque no se pase la prop
  const handleBack = () => {
    if (typeof goTo === "function") {
      goTo("dashboard");
    } else {
      router.push("/admin?section=dashboard", undefined, { shallow: true });
    }
  };

  // Detección reactiva de la clase admin-dark en el body
  useEffect(() => {
    const checkDark = () => {
      setIsDark(document.body.classList.contains("admin-dark"));
    };
    checkDark();

    const observer = new MutationObserver(checkDark);
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Carga de pagos desde la API interna
  useEffect(() => {
    fetch("/api/reports/revenue")
      .then((res) => res.json())
      .then((json) => {
        if (json.status === "1" && Array.isArray(json.data)) {
          setPayments(json.data);
          processData(json.data, "day");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al cargar reporte de recaudación:", err);
        setLoading(false);
      });
  }, []);

  const handleModeChange = (mode) => {
    setViewMode(mode);
    processData(payments, mode);
  };

  // Agrupa montos según la escala temporal seleccionada
  const processData = (data, mode) => {
    const grouped = {};
    let total = 0;
    let highest = { label: "-", amount: 0 };

    data.forEach((payment) => {
      const dateRaw = payment.transaction_date || payment.created_at;
      if (!dateRaw) return;

      const dateObj = parseISO(dateRaw);
      let key;

      if (mode === "day") {
        key = format(dateObj, "dd/MM/yyyy");
      } else if (mode === "week") {
        const weekStart = startOfWeek(dateObj, { weekStartsOn: 1 });
        key = `Semana ${format(weekStart, "dd/MM")}`;
      } else {
        key = format(dateObj, "MMMM yyyy", { locale: es });
      }

      const amount = Number(payment.amount_clp) || 0;
      if (!grouped[key]) grouped[key] = 0;
      grouped[key] += amount;
      total += amount;
    });

    Object.entries(grouped).forEach(([lbl, val]) => {
      if (val > highest.amount) {
        highest = { label: lbl, amount: val };
      }
    });

    setTotalRevenue(total);
    setMaxRecord(highest);

    setChartData({
      labels: Object.keys(grouped),
      datasets: [
        {
          label: "Recaudación (CLP)",
          data: Object.values(grouped),
          backgroundColor: isDark ? "rgba(59, 130, 246, 0.85)" : "rgba(37, 99, 235, 0.8)",
          hoverBackgroundColor: "#3b82f6",
          borderColor: "#3b82f6",
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    });
  };

  // Paleta neutral grafito/carbón (elimina el azulado de fondo)
  const theme = {
    bgCard: isDark ? "#18181b" : "#ffffff",
    bgCardSubtle: isDark ? "#27272a" : "#f4f4f5",
    border: isDark ? "#3f3f46" : "#e4e4e7",
    textPrimary: isDark ? "#f4f4f5" : "#18181b",
    textMuted: isDark ? "#a1a1aa" : "#71717a",
    gridLines: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.06)",
  };

  // Configuración de visualización y contraste de Chart.js
  const options = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: `Recaudación por ${viewMode === "day" ? "Día" : viewMode === "week" ? "Semana" : "Mes"}`,
          color: theme.textPrimary,
          font: { size: 13, weight: "bold" },
          padding: { bottom: 15 },
        },
        tooltip: {
          backgroundColor: isDark ? "#27272a" : "#ffffff",
          titleColor: isDark ? "#ffffff" : "#18181b",
          bodyColor: "#38bdf8",
          borderColor: isDark ? "#52525b" : "#e4e4e7",
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: (ctx) => ` $${Number(ctx.raw).toLocaleString("es-CL")} CLP`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: theme.textMuted,
            font: { size: 11 },
          },
        },
        y: {
          beginAtZero: true,
          grid: { color: theme.gridLines },
          ticks: {
            color: theme.textMuted,
            callback: (v) => `$${Number(v).toLocaleString("es-CL")}`,
            font: { size: 11 },
          },
        },
      },
    };
  }, [theme, isDark, viewMode]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5" style={{ color: theme.textMuted }}>
        <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
        <small>Cargando balance financiero...</small>
      </div>
    );
  }

  const avgTicket = payments.length > 0 ? Math.round(totalRevenue / payments.length) : 0;

  // Modo mini (utilizado en la tarjeta del panel principal)
  if (mini) {
    return (
      <div style={{ height: "240px" }}>
        {chartData && chartData.labels.length > 0 ? (
          <Bar data={chartData} options={options} />
        ) : (
          <div className="d-flex justify-content-center align-items-center h-100 small" style={{ color: theme.textMuted }}>
            No hay transacciones registradas.
          </div>
        )}
      </div>
    );
  }

  // Vista completa (sección "revenue")
  return (
    <div className="container-fluid px-0 revenue-container">
      {/* Barra superior con botón volver y total acumulado.
          La clase "revenue-header" controla el comportamiento responsive
          (en móvil se apila en columna, en PC se mantiene en fila). */}
      <div
        className="mb-4 p-3 rounded shadow-sm revenue-header"
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
              backgroundColor: theme.bgCardSubtle,
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
              <FaChartBar className="text-primary" />
              <span>Balance Financiero Webpay</span>
            </h5>
            <small style={{ color: theme.textMuted }}>
              Historial de compras y recaudación de pasajes
            </small>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <span
            className="badge px-3 py-2 fs-6 font-monospace revenue-total-badge"
            style={{
              backgroundColor: isDark ? "rgba(16, 185, 129, 0.15)" : "#dcfce7",
              color: "#10b981",
              border: "1px solid rgba(16, 185, 129, 0.3)",
            }}
          >
            Total: ${totalRevenue.toLocaleString("es-CL")} CLP
          </span>
        </div>
      </div>

      {/* Tarjetas de Métricas Ejecutivas (KPIs) */}
      <div className="row g-3 mb-4">
        <div className="col-md-3 col-sm-6">
          <div
            className="card border-0 shadow-sm p-3 rounded"
            style={{ backgroundColor: theme.bgCard, border: `1px solid ${theme.border}` }}
          >
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="small text-uppercase fw-semibold" style={{ color: theme.textMuted }}>
                Recaudación Total
              </span>
              <FaMoneyBillWave className="text-success" size={18} />
            </div>
            <h4 className="fw-bold mb-0 font-monospace" style={{ color: theme.textPrimary }}>
              ${totalRevenue.toLocaleString("es-CL")}
            </h4>
          </div>
        </div>

        <div className="col-md-3 col-sm-6">
          <div
            className="card border-0 shadow-sm p-3 rounded"
            style={{ backgroundColor: theme.bgCard, border: `1px solid ${theme.border}` }}
          >
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="small text-uppercase fw-semibold" style={{ color: theme.textMuted }}>
                Pasajes Vendidos
              </span>
              <FaTicketAlt className="text-primary" size={18} />
            </div>
            <h4 className="fw-bold mb-0 font-monospace" style={{ color: theme.textPrimary }}>
              {payments.length}
            </h4>
          </div>
        </div>

        <div className="col-md-3 col-sm-6">
          <div
            className="card border-0 shadow-sm p-3 rounded"
            style={{ backgroundColor: theme.bgCard, border: `1px solid ${theme.border}` }}
          >
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="small text-uppercase fw-semibold" style={{ color: theme.textMuted }}>
                Ticket Promedio
              </span>
              <FaReceipt className="text-warning" size={18} />
            </div>
            <h4 className="fw-bold mb-0 font-monospace" style={{ color: theme.textPrimary }}>
              ${avgTicket.toLocaleString("es-CL")}
            </h4>
          </div>
        </div>

        <div className="col-md-3 col-sm-6">
          <div
            className="card border-0 shadow-sm p-3 rounded"
            style={{ backgroundColor: theme.bgCard, border: `1px solid ${theme.border}` }}
          >
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="small text-uppercase fw-semibold" style={{ color: theme.textMuted }}>
                Mayor Venta
              </span>
              <FaTrophy className="text-info" size={18} />
            </div>
            <h5 className="fw-bold mb-0 text-truncate font-monospace" style={{ color: theme.textPrimary }}>
              ${maxRecord.amount.toLocaleString("es-CL")}
            </h5>
            <small style={{ color: theme.textMuted, fontSize: 11 }}>{maxRecord.label}</small>
          </div>
        </div>
      </div>

      {/* Gráfica Principal con Botones de Selección */}
      <div
        className="card border-0 shadow-sm p-4 rounded"
        style={{
          backgroundColor: theme.bgCard,
          border: `1px solid ${theme.border}`,
        }}
      >
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <div className="btn-group btn-group-sm">
            <button
              type="button"
              className="btn fw-semibold"
              style={{
                backgroundColor: viewMode === "day" ? "#2563eb" : theme.bgCardSubtle,
                color: viewMode === "day" ? "#ffffff" : theme.textPrimary,
                border: `1px solid ${theme.border}`,
              }}
              onClick={() => handleModeChange("day")}
            >
              Diario
            </button>
            <button
              type="button"
              className="btn fw-semibold"
              style={{
                backgroundColor: viewMode === "week" ? "#2563eb" : theme.bgCardSubtle,
                color: viewMode === "week" ? "#ffffff" : theme.textPrimary,
                border: `1px solid ${theme.border}`,
              }}
              onClick={() => handleModeChange("week")}
            >
              Semanal
            </button>
            <button
              type="button"
              className="btn fw-semibold"
              style={{
                backgroundColor: viewMode === "month" ? "#2563eb" : theme.bgCardSubtle,
                color: viewMode === "month" ? "#ffffff" : theme.textPrimary,
                border: `1px solid ${theme.border}`,
              }}
              onClick={() => handleModeChange("month")}
            >
              Mensual
            </button>
          </div>

          <small className="d-flex align-items-center gap-1" style={{ color: theme.textMuted }}>
            <FaCalendarCheck size={12} className="text-success" />
            <span>Transacciones autorizadas por Webpay Plus</span>
          </small>
        </div>

        {/* Contenedor de la gráfica.
            La altura se controla desde el CSS (.revenue-chart-wrapper)
            para que se adapte al tamaño de la pantalla:
            - PC: 420px
            - Móvil: 280px
            - Móvil pequeño: 240px */}
        <div className="revenue-chart-wrapper">
          {chartData && chartData.labels.length > 0 ? (
            <Bar data={chartData} options={options} />
          ) : (
            <div
              className="d-flex justify-content-center align-items-center h-100 small"
              style={{ color: theme.textMuted }}
            >
              No hay transacciones registradas en este período.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}