export const PAGE_TITLE = 'Configuración'
export const PAGE_SUBTITLE = 'Editá los system prompts de los agentes que analizan los contratos.'
export const PAGE_FOOTNOTE =
  'Los cambios se aplican al próximo análisis. Guardar reemplaza el prompt anterior: el ' +
  'servidor no guarda historial.'

export const LOADING_MESSAGE = 'Cargando prompts…'
export const LOAD_ERROR_MESSAGE = 'No se pudieron cargar los prompts. Intentá de nuevo.'
export const RETRY_LABEL = 'Reintentar'

export const UNSAVED_BADGE_LABEL = 'Sin guardar'
export const DISCARD_LABEL = 'Descartar cambios'
export const SAVE_LABEL = 'Guardar cambios'
export const SAVING_LABEL = 'Guardando…'
export const EMPTY_DRAFT_MESSAGE = 'El prompt no puede quedar vacío.'
export const SAVED_MESSAGE = 'Cambios guardados.'

export const MODAL_TITLE = '¿Sobrescribir el prompt?'
export const MODAL_CANCEL_LABEL = 'Cancelar'
export const MODAL_CONFIRM_LABEL = 'Sobrescribir'
export const MODAL_BODY_SUFFIX =
  'El servidor no guarda historial: no vas a poder volver al texto anterior.'

interface AgentInfo {
  label: string
  description?: string
}

const KNOWN_AGENTS: Record<string, AgentInfo> = {
  contextualization_agent: {
    label: 'Agente de contextualización',
    description:
      'Primer paso: mapea la estructura de ambos documentos y hace corresponder cada ' +
      'cláusula del contrato con la de la enmienda.',
  },
  extraction_agent: {
    label: 'Agente de extracción',
    description:
      'Segundo paso: sobre ese mapa, identifica y describe los cambios concretos entre el ' +
      'contrato y su enmienda.',
  },
}

export function getAgentLabel(agentName: string): string {
  const known = KNOWN_AGENTS[agentName]
  if (known) return known.label

  const spaced = agentName.replace(/_/g, ' ')
  if (spaced === '') return spaced
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

export function getAgentDescription(agentName: string): string | undefined {
  return KNOWN_AGENTS[agentName]?.description
}
