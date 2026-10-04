// src/pages/_app.js
import 'bootstrap/dist/css/bootstrap.min.css';
// globals define el reseteo y tipografia; home y admin manejan las vistas publica y privada respectivamente
import '../styles/globals.css';
import '../styles/home.css';
import '../styles/admin.css';
// CSS específico con media queries con altura adaptativa para mejor adaptacion en pantallas pequeñas
import '../styles/BusMapDetail.css';
import '../styles/RevenueDashboard.css';
import '../styles/ListComments.css';
import 'react-toastify/dist/ReactToastify.css';

export default function MyApp({ Component, pageProps }) {
  return (
    // Renderizado de la ruta actual.
    // El SDK de Google Maps se carga dinámicamente en BusMap.js,
    // por lo que no es necesario cargarlo aquí (evita doble carga).
    <Component {...pageProps} />
  );
}