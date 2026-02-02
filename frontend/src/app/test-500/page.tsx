// Página de prueba para forzar un error 500 en render
export default function Test500Page() {
	// Lanzamos un error durante el render para que Next.js utilice `app/error.tsx`
	throw new Error('Simulated 500 error for testing')
}
