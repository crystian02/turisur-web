// src/pages/admin.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { Navbar } from "react-bootstrap";
import { ToastContainer } from "react-toastify";
import { FaSun, FaMoon, FaSignOutAlt } from "react-icons/fa";
import "react-toastify/dist/ReactToastify.css";

// Cliente centralizado de autenticación y base de datos
import { supabase } from "../lib/supabaseClient";

import AddSchedule from "../components/Schedules/AddSchedule";
import DeleteSchedule from "../components/Schedules/DeleteSchedule";
import ListPayments from "../components/payments/ListPayments";
import ListComments from "../components/Comments/ListComments";
import AdminDashboard from "../components/Dashboard/AdminDashboard";
import BusMapDetail from "../components/Buses/BusMapDetail";
import RevenueDashboard from "../components/Reports/RevenueDashboard";

import logo from "../../public/images/logo.png";

export default function AdminPage() {
  const router = useRouter();
  const { section = "dashboard" } = router.query;

  const [darkMode, setDarkMode] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Cambia de sección en el panel sin recargar la página completa
  const goTo = (target) => {
    router.push(`/admin?section=${target}`, undefined, { shallow: true });
  };

  // Protege la ruta: si no hay sesión iniciada, redirige al login
  useEffect(() => {
    let isMounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!isMounted) return;

      if (!data?.user) {
        router.replace("/login");
      } else {
        setCheckingAuth(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [router]);

  // Aplica o retira la clase de modo oscuro en el body
  const toggleDarkMode = () => {
    const nextState = !darkMode;
    setDarkMode(nextState);
    document.body.classList.toggle("admin-dark", nextState);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  // Muestra un indicador de carga mientras se verifica el usuario
  if (checkingAuth) {
    return (
      <div 
        className="d-flex justify-content-center align-items-center vh-100" 
        style={{ backgroundColor: "#0f172a", color: "#94a3b8" }}
      >
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  return (
    <>
      <ToastContainer position="top-center" autoClose={3000} />

      {/* Barra superior de administración */}
      <Navbar
        bg={darkMode ? "dark" : "primary"}
        variant="dark"
        fixed="top"
        className="px-4 py-1"
        style={{ minHeight: 64 }}
      >
        <Navbar.Brand 
          className="d-flex align-items-center p-0 m-0" 
          style={{ cursor: "pointer" }}
          onClick={() => goTo("dashboard")}
        >
          <Image
            src={logo}
            width={95}
            height={70}
            alt="Buses Turisur"
            priority
            style={{ objectFit: "contain" }}
          />
        </Navbar.Brand>

        <div className="ms-auto d-flex align-items-center gap-2">
          {/* Alternar tema claro / oscuro */}
          <button
            type="button"
            className="btn btn-outline-light btn-sm d-flex align-items-center justify-content-center"
            style={{ width: 34, height: 34 }}
            title={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            onClick={toggleDarkMode}
          >
            {darkMode ? <FaSun size={14} /> : <FaMoon size={14} />}
          </button>

          {/* Cerrar sesión */}
          <button
            type="button"
            className="btn btn-danger btn-sm d-flex align-items-center gap-1"
            onClick={handleLogout}
          >
            <FaSignOutAlt size={12} />
            <span>Salir</span>
          </button>
        </div>
      </Navbar>

      {/* Vistas dinámicas del panel de control */}
      <main className="container-fluid" style={{ paddingTop: 90 }}>
        {section === "dashboard" && <AdminDashboard goTo={goTo} />}
        {section === "map" && <BusMapDetail goTo={goTo} />}
        {section === "revenue" && <RevenueDashboard goTo={goTo} />}
        {section === "payments" && <ListPayments />}
        {/* CAMBIO: se quitó isSection. Ahora ListComments usa el patrón
            mini = false por defecto, lo que muestra la vista completa
            con header y botón "Volver al Dashboard". */}
        {section === "comments" && <ListComments goTo={goTo} />}
        {section === "add" && <AddSchedule />}
        {section === "delete" && <DeleteSchedule />}
      </main>
    </>
  );
}