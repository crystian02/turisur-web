// src/pages/login.js
"use client";

import { useState } from "react";
import { useRouter } from "next/router";

// Se usa la instancia ya creada para no duplicar clientes de GoTrue en el navegador
import { supabase } from "../lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    // con trim se limpian espacios accidentales que suelen meter los teclados en moviles 
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });

    if (error) {
      setLoading(false);
      // Mensaje  para no revelar si fallo el usuario o la clave
      return setErrorMsg("Correo o contraseña incorrectos.");
    }

    // Redireccion al panel tras autenticar la sesion
    router.push("/admin");
  };

  return (
    <div
      className="public-page"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        // Degradado celeste (antes era verde oscuro)
        background: "linear-gradient(135deg, #0ea5e9, #0369a1)",
      }}
    >
      <div
        className="public-card"
        style={{
          width: "100%",
          maxWidth: 420,
          background: "white",
          padding: "32px",
          borderRadius: "18px",
          boxShadow: "0 20px 40px rgba(0,0,0,.25)",
        }}
      >
        {/* Acceso rapido para volver a la landing sin tener que usar atras del navegador */}
        <div style={{ marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => router.push("/")}
            style={{
              background: "transparent",
              border: "none",
              color: "#16a34a",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            &larr; Volver al inicio
          </button>
        </div>

        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <img
            src="/images/logo.png"
            alt="Buses Turisur"
            style={{ height: 56, marginBottom: 12 }}
          />
          <h2 className="public-title" style={{ marginBottom: 4 }}>
            Acceso Administrador
          </h2>
          <p style={{ fontSize: 14, color: "#64748b" }}>
            Panel de gestión Buses Turisur
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <label className="form-label small fw-bold text-muted">
            Correo electrónico
          </label>
          <input
            type="email"
            required
            placeholder="admin@turisur.cl"
            className="form-control public-input mb-3"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label className="form-label small fw-bold text-muted">
            Contraseña
          </label>
          <input
            type="password"
            required
            placeholder="••••••••"
            className="form-control public-input mb-3"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {errorMsg && (
            <div className="alert alert-danger text-center p-2 mb-3" style={{ fontSize: 14 }}>
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn w-100 public-btn"
            style={{
              background: "#16a34a",
              color: "white",
              fontWeight: 700,
              padding: "12px",
              borderRadius: 10,
              border: "none",
              marginTop: 8,
            }}
          >
            {loading ? "Validando credenciales..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}