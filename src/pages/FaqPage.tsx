import { Link } from 'react-router-dom'

type FaqEntry = { question: string; answer: string }

const FAQ_ENTRIES: FaqEntry[] = [
  {
    question: '¿Qué tipo de consultas puedo hacer?',
    answer:
      'Podés consultar sobre políticas de licencias, vacaciones, beneficios, ' +
      'procedimientos de incorporación, normativas internas y cualquier duda general de Recursos Humanos.',
  },
  {
    question: '¿Cómo funciona el sistema de búsqueda?',
    answer:
      'Workspace AI usa un sistema RAG (Retrieval-Augmented Generation): primero busca los fragmentos más ' +
      'relevantes en la base de conocimiento cargada por el equipo de RR.HH. y luego genera una respuesta ' +
      'en lenguaje natural basada en esos fragmentos.',
  },
  {
    question: '¿Las respuestas son siempre correctas?',
    answer:
      'El sistema hace su mejor esfuerzo, pero puede cometer errores o no tener información actualizada. ' +
      'Ante dudas críticas (licencias médicas, despidos, cuestiones legales), siempre confirmá con el ' +
      'área de RR.HH. directamente.',
  },
  {
    question: '¿Mis preguntas quedan guardadas?',
    answer:
      'Las preguntas y respuestas son visibles solo durante tu sesión en el navegador. Al cerrar la ' +
      'pestaña o recargar la página, el historial se borra. No se almacena historial en ningún servidor.',
  },
  {
    question: '¿Quién carga el conocimiento que usa el sistema?',
    answer:
      'El equipo de RR.HH. carga documentos (políticas, reglamentos, circulares) a través de la sección ' +
      'de carga RAG. El sistema solo sabe lo que fue explícitamente cargado.',
  },
  {
    question: '¿Qué pasa si el sistema no sabe la respuesta?',
    answer:
      'Workspace AI indicará que no encontró información suficiente y te recomendará consultar directamente ' +
      'con RR.HH. No inventa respuestas cuando no hay base documental.',
  },
]

function FaqPage() {
  return (
    <div className="mx-auto max-w-[700px] overflow-x-hidden px-5 py-8">
      <h1 className="mb-4 font-display text-2xl text-primary">Preguntas frecuentes</h1>
      <Link
        to="/"
        className="mb-8 inline-block text-sm text-on-surface-variant no-underline hover:text-primary"
      >
        ← Volver al chat
      </Link>
      <section className="flex flex-col gap-6">
        {FAQ_ENTRIES.map((entry) => (
          <article key={entry.question}>
            <h2 className="mb-2 text-[1.05rem] text-on-surface">{entry.question}</h2>
            <p className="m-0 text-[0.95rem] leading-[1.6] text-on-surface-variant">
              {entry.answer}
            </p>
          </article>
        ))}
      </section>
    </div>
  )
}

export default FaqPage
