// eslint.config.mjs
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

/* 
  Configuracion moderna de ESLint (Flat Config) para Next.js.
  Utiliza el conjunto de reglas 'core-web-vitals' para verificar
  accesibilidad, buenas practicas de React y optimizaciones de rendimiento.
 */

const eslintConfig = defineConfig([
  ...nextVitals,
  
  // Exclusion de directorios autogenerados y dependencias del analisis estatico
  globalIgnores([
    ".next/**",        // Salida de compilacion y cache de desarrollo de Next.js
    "out/**",          // Exportacion estatica
    "build/**",        // Paquetes optimizados para produccion
    "node_modules/**", // Dependencias externas
    "next-env.d.ts",   // Tipos autogenerados por Next.js
  ]),
]);

export default eslintConfig;

//

