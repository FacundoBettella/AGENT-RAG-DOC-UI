import {
  PageWrapper,
  PageTitle,
  BackLink,
  FaqList,
  FaqItem,
  FaqQuestion,
  FaqAnswer,
} from './FaqPage.styles'

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
      'Mercurial usa un sistema RAG (Retrieval-Augmented Generation): primero busca los fragmentos más ' +
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
      'Mercurial indicará que no encontró información suficiente y te recomendará consultar directamente ' +
      'con RR.HH. No inventa respuestas cuando no hay base documental.',
  },
]

function FaqPage() {
  return (
    <PageWrapper>
      <PageTitle>Preguntas frecuentes</PageTitle>
      <BackLink to="/">← Volver al chat</BackLink>
      <FaqList>
        {FAQ_ENTRIES.map((entry) => (
          <FaqItem key={entry.question}>
            <FaqQuestion>{entry.question}</FaqQuestion>
            <FaqAnswer>{entry.answer}</FaqAnswer>
          </FaqItem>
        ))}
      </FaqList>
    </PageWrapper>
  )
}

export default FaqPage
