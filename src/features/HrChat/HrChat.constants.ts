import type { Suggestion } from './HrChat.types'

export const ASSISTANT_NAME = 'Asistente Mercurial'
export const USER_NAME = 'Tú'

export const GREETING_TEXT =
  '¡Hola! Soy el asistente de Mercurial. Puedo responder consultas sobre RR.HH., ' +
  'tecnología y finanzas a partir de la base de conocimiento cargada. ¿En qué te ayudo?'

export const THINKING_TEXT = 'Mercurial está procesando tu consulta'
export const ERROR_TEXT = 'No se pudo obtener respuesta. Intentá de nuevo.'
export const RETRY_LABEL = 'Reintentar'

export const INPUT_PLACEHOLDER = 'Escribí tu consulta sobre RR.HH., tecnología o finanzas…'
export const INPUT_DISCLAIMER =
  'La IA puede cometer errores. Verificá la información con el área correspondiente.'

export const NO_SOURCES_INITIAL_TEXT = 'Los fragmentos que respalden la respuesta aparecerán acá.'
export const NO_SOURCES_EMPTY_TEXT = 'Esta respuesta no citó fragmentos de la base de conocimiento.'
export const DEFAULT_SOURCE_LABEL = 'Base de conocimiento'

export const SUGGESTIONS: readonly Suggestion[] = [
  {
    id: 'hr',
    label: 'Política de vacaciones',
    icon: 'beach_access',
    text: '¿Cómo funciona la política de vacaciones?',
  },
  {
    id: 'tech',
    label: 'Soporte técnico',
    icon: 'devices',
    text: '¿Cómo pido soporte técnico o un equipo nuevo?',
  },
  {
    id: 'finance',
    label: 'Reintegro de gastos',
    icon: 'payments',
    text: '¿Cómo se solicita un reintegro de gastos?',
  },
] as const
