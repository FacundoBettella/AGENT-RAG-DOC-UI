import type { RagDomain, IngestResult } from '../hooks/useRagForm'

export interface DomainOption {
  value: RagDomain
  label: string
  helper: string
  icon: string
}

export const DOMAIN_FIELDSET_LEGEND = 'Dominio de la base de conocimiento'
export const DOMAIN_HELP_TEXT =
  'Todos los archivos de esta carga se indexan en el dominio elegido.'
export const DOMAIN_HELP_ID = 'rag-domain-help'

export const DOMAIN_OPTIONS: DomainOption[] = [
  { value: 'hr', label: 'RR.HH.', helper: 'Políticas, vacaciones, licencias', icon: 'groups' },
  { value: 'tech', label: 'Tecnología', helper: 'Soporte, equipos, accesos', icon: 'devices' },
  { value: 'finance', label: 'Finanzas', helper: 'Reintegros, gastos, facturación', icon: 'payments' },
]

export function getDomainLabel(domain: RagDomain): string {
  return DOMAIN_OPTIONS.find((option) => option.value === domain)?.label ?? domain
}

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural
}

export function buildSuccessMessage(result: IngestResult): string {
  const domainLabel = getDomainLabel(result.domain)
  const fragmentWord = pluralize(result.chunksIndexed, 'fragmento', 'fragmentos')
  const fileWord = pluralize(result.documentsReceived, 'archivo', 'archivos')
  // Si el label del dominio ya termina en punto (p. ej. "RR.HH."), ese punto
  // hace las veces de cierre de la oración: no se duplica ("RR.HH..").
  const closing = domainLabel.endsWith('.') ? '' : '.'
  return `Se indexaron ${result.chunksIndexed} ${fragmentWord} de ${result.documentsReceived} ${fileWord} en la base de ${domainLabel}${closing}`
}
