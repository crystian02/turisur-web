/** @type {import('next').NextConfig} */
const nextConfig = {
  // Modo estricto de React para advertir malas prácticas o errores en desarrollo
  reactStrictMode: true,

  // Permite cargar imágenes alojadas en Supabase Storage
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },

  // Oculta 'x-powered-by: Next.js' en las respuestas del servidor
  poweredByHeader: false,
};

export default nextConfig;