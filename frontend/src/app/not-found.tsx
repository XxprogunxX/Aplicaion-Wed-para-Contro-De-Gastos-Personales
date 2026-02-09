import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">
          Esta página no existe. ¿Quieres volver al inicio?
        </p>

        <Link
          href="/"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Volver al inicio
        </Link>

        {/* Aria-live para lectores de pantalla */}
        <div aria-live="assertive" className="sr-only">
          Error 404. Página no encontrada.
        </div>
      </div>
    </div>
  );
}
