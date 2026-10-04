// src/pages/index.js
"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  FaBus, 
  FaMobileAlt, 
  FaPhoneAlt, 
  FaEnvelope, 
  FaInstagram, 
  FaCalendarAlt, 
  FaClock, 
  FaLock, 
  FaSearch, 
  FaRoute,
  FaHourglassHalf,
  FaMapMarkerAlt,
  FaStar
} from "react-icons/fa";

const normalize = (str = "") =>
  str
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const formatDuration = (minutes) => {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
};

/*
  Devuelve true si el día de la semana es válido para el campo "dia" del horario.
  dayOfWeek: 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
 */
const isDayValidForSchedule = (dayOfWeek, diaTexto) => {
  const dia = normalize(diaTexto);

  if (dia.includes("todos") || dia.includes("lunes a domingo")) return true;

  if (dia.includes("lunes a viernes")) {
    return dayOfWeek >= 1 && dayOfWeek <= 5;
  }

  if (
    dia.includes("fin de semana") ||
    dia.includes("sabado") ||
    dia.includes("domingo") ||
    dia.includes("sabados, domingos y festivos")
  ) {
    return dayOfWeek === 0 || dayOfWeek === 6;
  }

  return true;
};

/*
  Encuentra la próxima fecha válida a partir de hoy para el horario dado.
  Si el usuario eligió una hora, esa hora se usa como referencia.
  Si no, se usa la hora actual.

  Ejemplo: hoy domingo, hora elegida 08:00, filtro "Lunes a Viernes".
  → Devuelve el LUNES a las 08:00 (no domingo 08:00).
 */
const getReferenceDate = (horaDeseada, diaTexto, now = new Date()) => {
  const [h, m] = horaDeseada
    ? horaDeseada.split(":").map(Number)
    : [now.getHours(), now.getMinutes()];

  for (let i = 0; i < 7; i++) {
    const candidate = new Date(now);
    candidate.setDate(candidate.getDate() + i);
    candidate.setHours(h, m, 0, 0);

    const candidateDayOfWeek = candidate.getDay();

    if (!isDayValidForSchedule(candidateDayOfWeek, diaTexto)) continue;

    if (i === 0 && horaDeseada && candidate <= now) continue;
    if (i === 0 && !horaDeseada) {
      return now;
    }

    return candidate;
  }

  return now;
};

/*
  Calcula cuántos minutos faltan desde "referenceDate" hasta la próxima
  salida válida para el horario dado.
  Se usa SOLO para ordenar los resultados.
 */
const getRealMinutesDiff = (horaSalida, diaTexto, referenceDate) => {
  const [h, m] = horaSalida.split(":").map(Number);
  const targetMinutes = h * 60 + m;
  const refMinutes = referenceDate.getHours() * 60 + referenceDate.getMinutes();

  for (let i = 0; i < 8; i++) {
    const candidate = new Date(referenceDate);
    candidate.setDate(candidate.getDate() + i);
    const candidateDayOfWeek = candidate.getDay();

    if (!isDayValidForSchedule(candidateDayOfWeek, diaTexto)) continue;
    if (i === 0 && targetMinutes < refMinutes) continue;

    const daysUntil = i;
    const diff = daysUntil * 24 * 60 + targetMinutes - refMinutes;
    return diff;
  }

  return 7 * 24 * 60;
};

/*
  Calcula cuántos minutos faltan desde AHORA MISMO (new Date()) hasta la próxima
  salida válida para el horario dado.
  Se usa para MOSTRAR "Sale en Xh" al usuario.
 */
const getMinutesFromNow = (horaSalida, diaTexto, now = new Date()) => {
  const [h, m] = horaSalida.split(":").map(Number);
  const targetMinutes = h * 60 + m;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  for (let i = 0; i < 8; i++) {
    const candidate = new Date(now);
    candidate.setDate(candidate.getDate() + i);
    const candidateDayOfWeek = candidate.getDay();

    if (!isDayValidForSchedule(candidateDayOfWeek, diaTexto)) continue;
    if (i === 0 && targetMinutes <= nowMinutes) continue;

    const daysUntil = i;
    const diff = daysUntil * 24 * 60 + targetMinutes - nowMinutes;
    return diff;
  }

  return 7 * 24 * 60;
};

/*
  Texto de la próxima salida exacta calculada respecto a HOY (día real del sistema).
  Ej: "Hoy 15:10" / "Mañana 06:55" / "Lunes 06:55"
 */
const getNextDepartureLabel = (horaSalida, diaTexto, now = new Date()) => {
  const [h, m] = horaSalida.split(":").map(Number);
  const targetMinutes = h * 60 + m;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const nombresDias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

  for (let i = 0; i < 8; i++) {
    const candidate = new Date(now);
    candidate.setDate(candidate.getDate() + i);
    const candidateDayOfWeek = candidate.getDay();

    if (!isDayValidForSchedule(candidateDayOfWeek, diaTexto)) continue;
    if (i === 0 && targetMinutes <= nowMinutes) continue;

    const horaFormateada = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

    if (i === 0) return `Hoy ${horaFormateada}`;
    if (i === 1) return `Mañana ${horaFormateada}`;
    return `${nombresDias[candidateDayOfWeek]} ${horaFormateada}`;
  }

  return `${horaSalida} hrs`;
};

export default function Home() {
  const [schedules, setSchedules] = useState([]);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [dayType, setDayType] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/schedules")
      .then((res) => res.json())
      .then((res) => {
        setSchedules(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fallo al consultar horarios:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    setResults([]);
    setSearched(false);
  }, [origin, destination, dayType, selectedTime]);

  const origins = useMemo(
    () => [...new Set(schedules.map((s) => s.origen))],
    [schedules]
  );

  const destinations = useMemo(() => {
    if (!origin) return [];
    return [
      ...new Set(
        schedules
          .filter((s) => s.origen === origin)
          .map((s) => s.destino)
      ),
    ];
  }, [schedules, origin]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!origin || !destination || !dayType) {
      alert("Por favor seleccione origen, destino y tipo de jornada.");
      return;
    }

    // Filtramos por origen, destino y jornada
    const filtered = schedules.filter((s) => {
      const dia = normalize(s.dia);
      const aplicaTodos = dia.includes("todos") || dia.includes("lunes a domingo");
      const isSemana = aplicaTodos || dia === "semana" || dia.includes("lunes a viernes");
      const isFinde = aplicaTodos || dia.includes("fin de semana") || dia.includes("sabado") || dia.includes("domingo");

      return (
        normalize(s.origen) === normalize(origin) &&
        normalize(s.destino) === normalize(destination) &&
        ((dayType === "semana" && isSemana) || (dayType === "finde" && isFinde))
      );
    });

    const now = new Date();
    const diaTextoReferencia = filtered[0]?.dia || "";

    // Construimos la fecha de referencia ajustada al PRÓXIMO día válido
    // para la hora consultada. Solo se usa para ORDENAR los resultados.
    let referenceDate;
    if (selectedTime) {
      referenceDate = getReferenceDate(selectedTime, diaTextoReferencia, now);
    } else {
      const today = now.getDay();
      const todayIsValid = isDayValidForSchedule(today, diaTextoReferencia);
      if (todayIsValid) {
        referenceDate = now;
      } else {
        const hh = String(now.getHours()).padStart(2, "0");
        const mm = String(now.getMinutes()).padStart(2, "0");
        referenceDate = getReferenceDate(`${hh}:${mm}`, diaTextoReferencia, now);
      }
    }

    // Para cada horario calculamos:
    // - diffForSort: para ordenar (respecto a la hora consultada ajustada al día válido).
    // - diffFromNow: para mostrar "Sale en Xh" (respecto a AHORA MISMO).
    // - proximaSalida: para mostrar "Lunes 08:00" (respecto a HOY real).
    const enriched = filtered.map((s) => {
      const diffForSort = getRealMinutesDiff(s.hora_salida, s.dia, referenceDate);
      const diffFromNow = getMinutesFromNow(s.hora_salida, s.dia, now);
      const proximaSalida = getNextDepartureLabel(s.hora_salida, s.dia, now);
      return {
        ...s,
        minutosRestantes: diffFromNow,
        proximaSalida,
        _diffForSort: diffForSort,
      };
    });

    // Ordenamos por cercanía a la hora consultada (usa la referencia ajustada)
    enriched.sort((a, b) => a._diffForSort - b._diffForSort);

    setResults(enriched);
    setSearched(true);
  };

  const formatCLP = (val) =>
    new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(val);

  return (
    <div className="home-wrapper">
      <header className="home-navbar">
        <div className="brand-container">
          <Image
            src="/images/logo.png"
            alt="Logotipo Buses Turisur"
            width={120}
            height={48}
            priority
            style={{ objectFit: "contain" }}
          />
        </div>

        <nav className="nav-links">
          <Link href="#app">Aplicación Móvil</Link>
          <Link href="#servicios">Servicios Especiales</Link>
          <Link href="#contacto">Atención al Cliente</Link>
          <Link href="/login" className="login-link" title="Portal Administrativo">
            <FaLock size={12} color="#16a34a" />
            <span>Acceso Administración</span>
          </Link>
        </nav>
      </header>

      <section
        className="hero"
        style={{ backgroundImage: "url('/images/background.jpeg')" }}
      >
        <div className="hero-overlay" />

        <div className="hero-content">
          <div className="search-layout">
            
            <div className="search-left">
              <div className="hero-header">
                <h1>Transporte interurbano seguro, puntual y conectado</h1>
                <p>Consulte frecuencias oficiales, rutas activas y disponibilidad de pasajes</p>
              </div>

              <form className="search-box" onSubmit={handleSearch}>
                <div className="select-group">
                  <select
                    value={origin}
                    aria-label="Seleccionar ciudad de origen"
                    onChange={(e) => {
                      setOrigin(e.target.value);
                      setDestination("");
                    }}
                  >
                    <option value="">Origen...</option>
                    {origins.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="select-group">
                  <select
                    value={destination}
                    aria-label="Seleccionar ciudad de destino"
                    onChange={(e) => setDestination(e.target.value)}
                    disabled={!origin}
                  >
                    <option value="">Destino...</option>
                    {destinations.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="select-group">
                  <select
                    value={dayType}
                    aria-label="Tipo de jornada"
                    onChange={(e) => setDayType(e.target.value)}
                  >
                    <option value="">Jornada...</option>
                    <option value="semana">Lunes a Viernes</option>
                    <option value="finde">Sábados, Domingos y Festivos</option>
                  </select>
                </div>

                <div className="select-group">
                  <input
                    type="time"
                    className="time-input"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    aria-label="Seleccionar hora de salida deseada"
                    placeholder="Hora..."
                  />
                </div>

                <button type="submit" className="search-btn" disabled={loading}>
                  <FaSearch size={13} color="#ffffff" style={{ marginRight: 6 }} />
                  <span>{loading ? "..." : "Consultar"}</span>
                </button>
              </form>

              <small className="search-hint">
                Si no eliges una hora, se usará la hora actual de tu dispositivo.
              </small>
            </div>

            <div className="search-right">
              {searched && (
                <div className="mini-results">
                  <div className="results-header">
                    <h6>Itinerarios programados</h6>
                    <span className="results-count">{results.length} disponibles</span>
                  </div>

                  {results.length === 0 ? (
                    <div className="empty-results text-center py-3">
                      <p className="text-muted mb-1" style={{ fontSize: 13 }}>
                        No hay salidas registradas para este tramo y jornada.
                      </p>
                      <small className="text-secondary">
                        Consulte directamente por servicios especiales.
                      </small>
                    </div>
                  ) : (
                    <div className="results-scroll">
                      {results.map((r, index) => {
                        const esProximo = index === 0;
                        return (
                          <article
                            key={r.id}
                            className={`schedule-card ${esProximo ? "schedule-card-next" : ""}`}
                          >
                            <div className="card-top">
                              <span className="route-title">
                                <FaRoute className="route-icon" color="#16a34a" />
                                {r.origen} &rarr; {r.destino}
                              </span>
                              <span className="price-tag">{formatCLP(r.precio)}</span>
                            </div>

                            {esProximo && (
                              <div className="next-badge">
                                <FaStar size={9} style={{ marginRight: 4 }} />
                                Próximo bus · {r.proximaSalida}
                              </div>
                            )}

                            <div className="card-details">
                              <div className="detail-item">
                                <FaClock className="item-icon" color="#64748b" />
                                <span>Salida: <strong>{r.hora_salida} hrs</strong></span>
                              </div>
                              <div className="detail-item">
                                <FaCalendarAlt className="item-icon" color="#64748b" />
                                <span>{r.dia}</span>
                              </div>
                            </div>

                            <div className="card-extra">
                              <div className="extra-item">
                                <FaHourglassHalf className="extra-icon" color="#16a34a" />
                                <span>
                                  {r.minutosRestantes <= 1
                                    ? "Sale ahora"
                                    : `Sale en ${formatDuration(r.minutosRestantes)}`}
                                </span>
                              </div>

                              <div className="extra-item">
                                <FaClock className="extra-icon" color="#2563eb" />
                                <span>Próxima: <strong>{r.proximaSalida}</strong></span>
                              </div>

                              <div className="extra-item">
                                <FaMapMarkerAlt className="extra-icon" color="#94a3b8" />
                                <span className="text-muted">Tiempo de llegada: --</span>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      <section className="features-grid">
        <div className="feature-item" id="app">
          <div className="icon-wrapper">
            <FaMobileAlt size={20} color="#16a34a" />
          </div>
          <h3>Plataforma Digital</h3>
          <p>
            Venta y validación electrónica con Webpay Plus y monitoreo satelital en ruta para mayor precisión de llegada.
          </p>
        </div>

        <div className="feature-item" id="contacto">
          <div className="icon-wrapper">
            <FaPhoneAlt size={18} color="#16a34a" />
          </div>
          <h3>Canales de Atención</h3>
          <ul className="contact-list">
            <li>
              <FaPhoneAlt className="contact-icon" color="#16a34a" />
              <span>+56 9 2398 5564</span>
            </li>
            <li>
              <FaEnvelope className="contact-icon" color="#16a34a" />
              <span>contacto@busesturisur.cl</span>
            </li>
            <li>
              <FaInstagram className="contact-icon" color="#16a34a" />
              <span>@busesturisur</span>
            </li>
          </ul>
        </div>

        <div className="feature-item" id="servicios">
          <div className="icon-wrapper">
            <FaBus size={19} color="#16a34a" />
          </div>
          <h3>Servicios Especiales</h3>
          <p>
            Traslado privado para empresas e instituciones dentro y fuera de la región.
          </p>
        </div>
      </section>

      <footer className="corporate-footer">
        <div className="footer-content">
          <div className="footer-info">
            <span className="footer-title">Buses TuriSur</span>
            <p>Conectividad y transporte de pasajeros en la Región de Los Ríos.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}