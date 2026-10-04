// src/components/Buses/BusMap.js
"use client";

import { useEffect, useCallback, useRef, useState } from "react";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  "https://turisur-mobileback.onrender.com";

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

export default function BusMap({ height = "100%", selectedBus = null }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef({});
  const geofencesRef = useRef([]);
  const infoWindowRef = useRef(null);
  const socketRef = useRef(null);

  const activeMarkerRef = useRef(null);
  const infoIntervalRef = useRef(null);

  const hasAutoCenteredRef = useRef(false);

  const [initialized, setInitialized] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const GEOFENCES = [
    { name: "INACAP Valdivia", lat: -39.805604, lng: -73.215235, radius: 200, color: "#8e2eff" },
    { name: "Salida Puente", lat: -39.54131, lng: -72.9629, radius: 150, color: "#ff8800" },
    { name: "Misissipi", lat: -39.44803, lng: -73.22371, radius: 200, color: "#ff8800" },
    { name: "Mehuín", lat: -39.43685, lng: -73.21589, radius: 70, color: "#00bfff" },
    { name: "Terminal Valdivia", lat: -39.81489, lng: -73.23516, radius: 100, color: "#00bfff" },
    { name: "Pelchuquin", lat: -39.63256, lng: -73.07383, radius: 300, color: "#8e2eff" },
    { name: "Puringue Rico", lat: -39.51135, lng: -73.001805, radius: 200, color: "#ff8800" },
    { name: "Nogal", lat: -39.432489, lng: -73.019594, radius: 200, color: "#791a91" },
  ];

  // Carga dinámica del SDK de Google Maps.
  // Incluye "loading=async" para evitar la advertencia de rendimiento.

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.google?.maps?.Map) {
      setScriptLoaded(true);
      return;
    }

    const existingScript = document.getElementById("google-maps-script");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&loading=async&libraries=marker,places,geometry`;
      script.async = true;
      script.defer = true;
      script.onload = () => setScriptLoaded(true);
      script.onerror = () => console.error("[BusMap] Error al cargar Google Maps SDK");
      document.head.appendChild(script);
    } else {
      existingScript.addEventListener("load", () => setScriptLoaded(true));
    }
  }, []);

  const adjustCameraToBuses = useCallback(() => {
    const map = mapInstance.current;
    if (!map || !window.google?.maps) return;

    const activeMarkers = Object.values(markersRef.current).filter(
      (m) => m && m.map !== null
    );

    if (activeMarkers.length === 0) return;

    if (activeMarkers.length === 1) {
      const targetPos = activeMarkers[0].position;
      if (targetPos) {
        const lat = typeof targetPos.lat === "function" ? targetPos.lat() : targetPos.lat;
        const lng = typeof targetPos.lng === "function" ? targetPos.lng() : targetPos.lng;
        map.panTo({ lat: Number(lat), lng: Number(lng) });
        map.setZoom(12);
      }
    } else {
      const bounds = new window.google.maps.LatLngBounds();
      activeMarkers.forEach((m) => {
        const pos = m.position;
        if (pos) {
          const lat = typeof pos.lat === "function" ? pos.lat() : pos.lat;
          const lng = typeof pos.lng === "function" ? pos.lng() : pos.lng;
          bounds.extend(new window.google.maps.LatLng(Number(lat), Number(lng)));
        }
      });

      map.fitBounds(bounds, {
        top: 80,
        right: 80,
        bottom: 80,
        left: 80,
      });

      window.google.maps.event.addListenerOnce(map, "idle", () => {
        if (map.getZoom() > 13) {
          map.setZoom(12);
        }
      });
    }
  }, []);

  const drawGeofences = () => {
    const map = mapInstance.current;
    if (!map) return;

    const isDark =
      typeof document !== "undefined" &&
      document.body.classList.contains("admin-dark");

    geofencesRef.current.forEach((g) => {
      if (g.circle) g.circle.setMap(null);
      if (g.marker) g.marker.map = null;
    });
    geofencesRef.current = [];

    GEOFENCES.forEach((g) => {
      const circle = new window.google.maps.Circle({
        map,
        center: { lat: g.lat, lng: g.lng },
        radius: g.radius,
        strokeColor: g.color,
        strokeOpacity: 0.85,
        strokeWeight: 2,
        fillColor: g.color,
        fillOpacity: isDark ? 0.18 : 0.08,
        zIndex: 1,
      });

      const labelDiv = document.createElement("div");
      labelDiv.textContent = g.name;
      labelDiv.style.fontSize = "11px";
      labelDiv.style.fontWeight = "700";
      labelDiv.style.backgroundColor = isDark ? "#0f172a" : "#ffffff";
      labelDiv.style.color = g.color;
      labelDiv.style.border = `1.5px solid ${g.color}`;
      labelDiv.style.padding = "2px 7px";
      labelDiv.style.borderRadius = "6px";
      labelDiv.style.boxShadow = isDark
        ? "0 2px 6px rgba(0,0,0,0.7)"
        : "0 2px 5px rgba(0,0,0,0.2)";
      labelDiv.style.pointerEvents = "none";
      labelDiv.style.transform = "translateY(-36px)";
      labelDiv.style.whiteSpace = "nowrap";

      let marker = null;
      if (window.google.maps.marker?.AdvancedMarkerElement) {
        marker = new window.google.maps.marker.AdvancedMarkerElement({
          map,
          position: { lat: g.lat, lng: g.lng },
          content: labelDiv,
          zIndex: 20,
        });
      }

      geofencesRef.current.push({ circle, marker });
    });
  };

  const initMap = useCallback(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Verificación: Asegurarse de que google.maps.Map esté disponible.
    if (!window.google?.maps?.Map) {
      console.warn("[BusMap] google.maps.Map aún no está disponible.");
      return;
    }

    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      center: { lat: -39.63256, lng: -73.07383 },
      zoom: 10,
      mapId: "4504f8b37365c3d0",
      gestureHandling: "greedy",
      streetViewControl: false,
      fullscreenControl: false,
      mapTypeControl: false,
    });

    drawGeofences();
    infoWindowRef.current = new window.google.maps.InfoWindow();
    setInitialized(true);

    setTimeout(() => {
      if (window.google?.maps && mapInstance.current) {
        window.google.maps.event.trigger(mapInstance.current, "resize");
      }
    }, 200);
  }, []);

  const buildInfoContent = (marker) => {
    const isDark =
      typeof document !== "undefined" &&
      document.body.classList.contains("admin-dark");

    const now = Date.now();
    const secondsAgo = Math.floor((now - (marker.__lastUpdateMs || now)) / 1000);

    const hourText = new Date(marker.__lastUpdateMs || now).toLocaleTimeString("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const isOffline = secondsAgo > 25;
    const bg = isDark ? "#0f172a" : "#ffffff";
    const textMain = isDark ? "#f8fafc" : "#0f172a";
    const textSub = isDark ? "#94a3b8" : "#64748b";
    const border = isDark ? "#334155" : "#e2e8f0";

    // CAMBIO : redondeamos la velocidad a 1 decimal con toFixed(1) para no mostrar decimales innecesarios.
    
    const speedValue = Number(
      marker.__bus?.speed || marker.__bus?.last_speed || 0
    ).toFixed(1);

    return `
      <div style="padding: 10px 12px; font-family: sans-serif; background: ${bg}; color: ${textMain}; border-radius: 8px; min-width: 170px;">
        <div style="font-weight: 700; font-size: 14px; margin-bottom: 5px; color: ${textMain};">
          ${marker.__bus?.alias || "Unidad en ruta"}
        </div>
        <div style="display: flex; align-items: center; gap: 6px; font-size: 12px; margin-bottom: 7px;">
          <span style="
            display: inline-block;
            width: 9px;
            height: 9px;
            border-radius: 50%;
            background-color: ${isOffline ? "#dc2626" : "#16a34a"};
          "></span>
          <strong style="color: ${isOffline ? "#dc2626" : "#16a34a"};">
            ${isOffline ? "Sin transmisión reciente" : `${speedValue} km/h`}
          </strong>
        </div>
        <div style="font-size: 11px; color: ${textSub}; border-top: 1px solid ${border}; padding-top: 5px; line-height: 1.4;">
          <div>Hora: <strong style="color: ${textMain};">${hourText}</strong></div>
          <div>Reporte: hace ${secondsAgo} seg</div>
        </div>
      </div>
    `;
  };

  const syncMarkerState = (marker, id) => {
    const secondsAgo = Math.floor((Date.now() - (marker.__lastUpdateMs || 0)) / 1000);

    if (secondsAgo > 90) {
      if (marker.map) marker.map = null;
      delete markersRef.current[id];
      if (activeMarkerRef.current === marker) {
        if (infoWindowRef.current) infoWindowRef.current.close();
        activeMarkerRef.current = null;
      }
      return;
    }

    const iconUrl = secondsAgo > 25 ? "/images/car_offline.png" : "/images/car.png";
    if (marker.__img) {
      marker.__img.src = iconUrl;
    }
  };

  const upsertBusMarker = useCallback((bus) => {
    if (!mapInstance.current) return;

    const latVal = bus.lat ?? bus.last_lat;
    const lngVal = bus.long ?? bus.lng ?? bus.last_lng;

    if (latVal == null || lngVal == null) return;

    const id = bus.driver_id || bus.uuid || bus.id;
    if (!id) return;

    const lastUpdateMs =
      bus.updated_at_ms ||
      (bus.updated_at ? new Date(bus.updated_at).getTime() : Date.now());

    const diff = (Date.now() - lastUpdateMs) / 1000;
    if (diff > 90) return;

    const iconUrl = diff > 25 ? "/images/car_offline.png" : "/images/car.png";
    let marker = markersRef.current[id];

    if (!marker) {
      const img = document.createElement("img");
      img.src = iconUrl;
      img.style.width = "46px";
      img.style.height = "auto";
      img.style.cursor = "pointer";
      img.style.filter = "drop-shadow(0 2px 5px rgba(0,0,0,0.5))";
      // CAMBIO: padding + margin negativos para agrandar el área clickeable
      // sin que el ícono se vea más grande visualmente.
      img.style.padding = "8px";
      img.style.margin = "-8px";
      img.style.boxSizing = "content-box";

      // Función que abre el InfoWindow. La definimos ANTES de crear el marker
      // para poder reutilizarla en varios listeners.
      const openInfoWindow = () => {
        console.log("[BusMap] Clic sobre el marcador:", id);
        activeMarkerRef.current = marker;
        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(buildInfoContent(marker));
          infoWindowRef.current.open({
            anchor: marker,
            map: mapInstance.current,
            shouldFocus: false,
          });
        }

        clearInterval(infoIntervalRef.current);
        infoIntervalRef.current = setInterval(() => {
          if (activeMarkerRef.current === marker && infoWindowRef.current) {
            infoWindowRef.current.setContent(buildInfoContent(marker));
            syncMarkerState(marker, id);
          }
        }, 1000);
      };

      if (window.google.maps.marker?.AdvancedMarkerElement) {
        // CAMBIO: gmpClickable: true es OBLIGATORIO para que
        // AdvancedMarkerElement emita eventos de clic.

        marker = new window.google.maps.marker.AdvancedMarkerElement({
          map: mapInstance.current,
          position: { lat: Number(latVal), lng: Number(lngVal) },
          content: img,
          zIndex: 9999,
          gmpClickable: true, //  para que el marcador sea clickeable y abra un info window
        });

        // CAMBIO: solo registramos "gmp-click" (API recomendada por Google).
        // Se eliminó el listener "click" adicional porque Google lanzaba la advertencia:
        //   "<gmp-advanced-marker>: Please use addEventListener('gmp-click', ...)instead of addEventListener('click', ...)"
        
        marker.addEventListener("gmp-click", openInfoWindow);
      } else {
        marker = new window.google.maps.Marker({
          map: mapInstance.current,
          position: { lat: Number(latVal), lng: Number(lngVal) },
          icon: { url: iconUrl, scaledSize: new window.google.maps.Size(48, 28) },
          zIndex: 9999,
        });

        // Para el Marker tradicional usamos addListener.
        marker.addListener("click", openInfoWindow);
      }

      // CAMBIO: listener directo sobre el <img> interno.
      // Esto garantiza que el clic funcione incluso si gmp-click no se
      // dispara correctamente por algún motivo de configuración del navegador.

      img.addEventListener("click", openInfoWindow);
      // Detenemos la propagación del evento para que el mapa no lo capture antes.
      img.addEventListener("mousedown", (e) => e.stopPropagation());
      img.addEventListener("touchstart", (e) => e.stopPropagation());

      marker.__img = img;

      markersRef.current[id] = marker;
    }

    if (marker.position) {
      marker.position = { lat: Number(latVal), lng: Number(lngVal) };
      marker.zIndex = 9999;
    } else if (marker.setPosition) {
      marker.setPosition({ lat: Number(latVal), lng: Number(lngVal) });
      marker.setZIndex(9999);
    }

    marker.__lastUpdateMs = lastUpdateMs;
    marker.__bus = bus;
  }, []);

  // Al hacer clic en un bus específico desde la lista lateral
  useEffect(() => {
    if (!mapInstance.current || !selectedBus) return;

    const latVal = Number(selectedBus.lat ?? selectedBus.last_lat);
    const lngVal = Number(selectedBus.long ?? selectedBus.lng ?? selectedBus.last_lng);

    if (isNaN(latVal) || isNaN(lngVal)) return;

    mapInstance.current.panTo({ lat: latVal, lng: lngVal });
    mapInstance.current.setZoom(13);

    const busId = selectedBus.driver_id || selectedBus.uuid || selectedBus.id;
    const marker = markersRef.current[busId];

    if (marker && infoWindowRef.current) {
      activeMarkerRef.current = marker;
      if (marker.zIndex !== undefined) marker.zIndex = 10000;
      infoWindowRef.current.setContent(buildInfoContent(marker));
      infoWindowRef.current.open({
        anchor: marker,
        map: mapInstance.current,
        shouldFocus: false,
      });

      clearInterval(infoIntervalRef.current);
      infoIntervalRef.current = setInterval(() => {
        if (activeMarkerRef.current === marker && infoWindowRef.current) {
          infoWindowRef.current.setContent(buildInfoContent(marker));
          syncMarkerState(marker, busId);
        }
      }, 1000);
    }
  }, [selectedBus]);

  // Carga inicial y auto-encuadre panorámico
  useEffect(() => {
    if (!initialized) return;

    fetch("/api/buses")
      .then((res) => res.json())
      .then((res) => {
        if (res.data && Array.isArray(res.data)) {
          res.data.forEach((bus) => upsertBusMarker(bus));

          if (!hasAutoCenteredRef.current && res.data.length > 0) {
            setTimeout(() => {
              adjustCameraToBuses();
              hasAutoCenteredRef.current = true;
            }, 300);
          }
        }
      })
      .catch((err) => console.error("[BusMap] Error en carga inicial:", err));
  }, [initialized, upsertBusMarker, adjustCameraToBuses]);

  // Sockets en tiempo real
  useEffect(() => {
    if (!initialized) return;

    let isSubscribed = true;

    import("socket.io-client").then(({ io }) => {
      if (!isSubscribed) return;

      socketRef.current = io(SOCKET_URL, {
        transports: ["polling", "websocket"],
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });

      socketRef.current.on("car_update_location", (msg) => {
        if (msg?.status === "1" && msg?.payload) {
          upsertBusMarker(msg.payload);

          if (!hasAutoCenteredRef.current) {
            adjustCameraToBuses();
            hasAutoCenteredRef.current = true;
          }
        }
      });

      socketRef.current.on("car_visibility_changed", (msg) => {
        if (msg?.payload) {
          upsertBusMarker(msg.payload);
        }
      });
    });

    return () => {
      isSubscribed = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      clearInterval(infoIntervalRef.current);
    };
  }, [initialized, upsertBusMarker, adjustCameraToBuses]);

  // CAMBIO: Este useEffect ahora espera con polling a que
  // window.google.maps.Map esté realmente disponible antes de llamar a initMap().
  // Esto soluciona el error "window.google.maps.Map is not a constructor".
  
  useEffect(() => {
    if (!scriptLoaded) return;
    if (mapInstance.current) return;

    let cancelled = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 50; // 50 * 200ms = 10s máximo de espera

    const tryInit = () => {
      if (cancelled) return;
      if (mapInstance.current) return;

      if (window.google?.maps?.Map) {
        initMap();
      } else {
        attempts++;
        if (attempts >= MAX_ATTEMPTS) {
          console.error("[BusMap] Google Maps no se cargó después de 10s");
          return;
        }
        setTimeout(tryInit, 200);
      }
    };

    tryInit();

    return () => {
      cancelled = true;
    };
  }, [scriptLoaded, initMap]);

  // Recupera el mapa al volver de segundo plano.
  useEffect(() => {
    if (!initialized) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("[BusMap] Página visible de nuevo, refrescando marcadores...");

        Object.keys(markersRef.current).forEach((id) => {
          const marker = markersRef.current[id];
          if (marker) {
            if (marker.map) marker.map = null;
            else if (marker.setMap) marker.setMap(null);
          }
        });
        markersRef.current = {};

        fetch("/api/buses")
          .then((res) => res.json())
          .then((res) => {
            if (res.data && Array.isArray(res.data)) {
              res.data.forEach((bus) => upsertBusMarker(bus));
              setTimeout(() => adjustCameraToBuses(), 300);
            }
          })
          .catch((err) => console.error("[BusMap] Error al refrescar en visibilitychange:", err));
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [initialized, upsertBusMarker, adjustCameraToBuses]);

  // Redimensiona el mapa al rotar el celular (horizontal/vertical).
  useEffect(() => {
    if (!initialized) return;
    const handleResize = () => {
      if (mapInstance.current && window.google?.maps) {
        window.google.maps.event.trigger(mapInstance.current, "resize");
      }
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [initialized]);

  return (
    // touchAction:en  "none" permite que el mapa capture los gestos táctiles.
    // El scroll de la página se hace por los bordes (fuera del mapa), donde no hay touchAction.
    <div
      ref={mapRef}
      style={{
        width: "100%",
        height: height || "100%",
        minHeight: "280px",
        borderRadius: "8px",
        overflow: "hidden",
        touchAction: "none", // 1 solo dedo interactúa con el mapa
      }}
    />
  );
}