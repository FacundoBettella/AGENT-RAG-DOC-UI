import { render, screen, within, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import SettingsPage from '../src/pages/SettingsPage'

vi.mock('../src/services/promptsService', () => ({
  promptsService: { list: vi.fn(), update: vi.fn() },
}))

vi.mock('../src/services/analyticsService', () => ({
  analyticsService: { trackEvent: vi.fn() },
}))

import { promptsService } from '../src/services/promptsService'
import { analyticsService } from '../src/services/analyticsService'
import type { AgentPrompt } from '../src/services/promptsService'

const mockedList = vi.mocked(promptsService.list)
const mockedUpdate = vi.mocked(promptsService.update)
const mockedTrackEvent = vi.mocked(analyticsService.trackEvent)

const EXTRACTION_PROMPT = 'Sos un Auditor de cambios contractuales.'
const CONTEXTUALIZATION_PROMPT = 'Sos un Analista de contexto documental.'

function renderSettings() {
  return render(<SettingsPage />)
}

async function waitForReady() {
  await waitFor(() => expect(screen.getAllByRole('region').length).toBeGreaterThan(0))
}

function getCard(agentLabel: string) {
  return screen.getByRole('region', { name: agentLabel })
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ────────────────────────────────────────────────────────────────
// @s1 — Carga inicial, orden del backend, agente desconocido
// ────────────────────────────────────────────────────────────────
describe('PromptsConfig — @s1 Carga inicial: una card por agente, en el orden recibido, sin asumir los dos nombres conocidos', () => {
  it('muestra tres cards en el orden del backend, con label conocido y label derivado para el desconocido', async () => {
    mockedList.mockResolvedValue([
      { agentName: 'extraction_agent', systemPrompt: EXTRACTION_PROMPT },
      { agentName: 'contextualization_agent', systemPrompt: CONTEXTUALIZATION_PROMPT },
      { agentName: 'review_agent', systemPrompt: 'Sos un Revisor.' },
    ])

    renderSettings()
    await waitForReady()

    const headings = screen.getAllByRole('heading', { level: 2 })
    expect(headings.map((heading) => heading.textContent)).toEqual([
      'Agente de extracción',
      'Agente de contextualización',
      'Review agent',
    ])
  })
})

// ────────────────────────────────────────────────────────────────
// @s2 — Error al cargar
// ────────────────────────────────────────────────────────────────
describe('PromptsConfig — @s2 Error al cargar los prompts: bloque de error con mensaje y "Reintentar"', () => {
  it('muestra el mensaje de error, el botón Reintentar, y ninguna card', async () => {
    mockedList.mockRejectedValue(new Error('No se pudieron cargar los prompts. Intentá de nuevo.'))

    renderSettings()

    await waitFor(() =>
      expect(
        screen.getByText('No se pudieron cargar los prompts. Intentá de nuevo.')
      ).toBeInTheDocument()
    )
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
    expect(screen.queryAllByRole('heading', { level: 2 })).toHaveLength(0)
  })
})

// ────────────────────────────────────────────────────────────────
// @s3 — Editar marca "Sin guardar" y habilita "Guardar cambios"
// ────────────────────────────────────────────────────────────────
describe('PromptsConfig — @s3 Editar el textarea marca "Sin guardar" y habilita "Guardar cambios"', () => {
  it('aparece el badge, se habilita Guardar cambios y aparece Descartar cambios', async () => {
    mockedList.mockResolvedValue([
      { agentName: 'extraction_agent', systemPrompt: EXTRACTION_PROMPT },
    ])
    renderSettings()
    await waitForReady()

    const card = getCard('Agente de extracción')
    const textarea = within(card).getByLabelText('System prompt de Agente de extracción')
    fireEvent.change(textarea, { target: { value: `${EXTRACTION_PROMPT} Editado.` } })

    expect(within(card).getByText('Sin guardar')).toBeInTheDocument()
    expect(within(card).getByRole('button', { name: 'Guardar cambios' })).toBeEnabled()
    expect(within(card).getByRole('button', { name: 'Descartar cambios' })).toBeInTheDocument()
  })
})

// ────────────────────────────────────────────────────────────────
// @s4 — Descartar cambios revierte al último valor guardado
// ────────────────────────────────────────────────────────────────
describe('PromptsConfig — @s4 "Descartar cambios" revierte el textarea al último valor guardado', () => {
  it('el textarea vuelve al valor guardado y desaparecen el badge y el botón', async () => {
    mockedList.mockResolvedValue([
      { agentName: 'extraction_agent', systemPrompt: EXTRACTION_PROMPT },
    ])
    renderSettings()
    await waitForReady()

    const card = getCard('Agente de extracción')
    const textarea = within(card).getByLabelText<HTMLTextAreaElement>(
      'System prompt de Agente de extracción'
    )
    fireEvent.change(textarea, { target: { value: 'Borrador editado sin guardar.' } })
    expect(within(card).getByText('Sin guardar')).toBeInTheDocument()

    const user = userEvent.setup()
    await user.click(within(card).getByRole('button', { name: 'Descartar cambios' }))

    expect(textarea.value).toBe(EXTRACTION_PROMPT)
    expect(within(card).queryByText('Sin guardar')).not.toBeInTheDocument()
    expect(within(card).queryByRole('button', { name: 'Descartar cambios' })).not.toBeInTheDocument()
  })
})

// ────────────────────────────────────────────────────────────────
// @s5 — Borrador vacío o solo espacios deshabilita Guardar cambios
// ────────────────────────────────────────────────────────────────
describe('PromptsConfig — @s5 Un borrador vacío o con solo espacios deja "Guardar cambios" deshabilitado', () => {
  it('el botón queda deshabilitado y muestra el mensaje de validación', async () => {
    mockedList.mockResolvedValue([
      { agentName: 'extraction_agent', systemPrompt: EXTRACTION_PROMPT },
    ])
    renderSettings()
    await waitForReady()

    const card = getCard('Agente de extracción')
    const textarea = within(card).getByLabelText('System prompt de Agente de extracción')
    fireEvent.change(textarea, { target: { value: '   ' } })

    expect(within(card).getByRole('button', { name: 'Guardar cambios' })).toBeDisabled()
    expect(within(card).getByText('El prompt no puede quedar vacío.')).toBeInTheDocument()
  })
})

// ────────────────────────────────────────────────────────────────
// @s6 — "Guardar cambios" abre el modal, instancia única
// ────────────────────────────────────────────────────────────────
describe('PromptsConfig — @s6 "Guardar cambios" abre el modal sin disparar el PUT, instancia única', () => {
  it('muestra un único modal, no llama a update, foco en Cancelar, y no toca la otra card', async () => {
    mockedList.mockResolvedValue([
      { agentName: 'extraction_agent', systemPrompt: EXTRACTION_PROMPT },
      { agentName: 'contextualization_agent', systemPrompt: CONTEXTUALIZATION_PROMPT },
    ])
    renderSettings()
    await waitForReady()

    const extractionCard = getCard('Agente de extracción')
    const contextCard = getCard('Agente de contextualización')

    fireEvent.change(within(extractionCard).getByLabelText('System prompt de Agente de extracción'), {
      target: { value: 'Draft de extracción.' },
    })
    const contextTextarea = within(contextCard).getByLabelText<HTMLTextAreaElement>(
      'System prompt de Agente de contextualización'
    )
    fireEvent.change(contextTextarea, { target: { value: 'Draft de contextualización.' } })

    const user = userEvent.setup()
    await user.click(within(extractionCard).getByRole('button', { name: 'Guardar cambios' }))

    const dialogs = screen.getAllByRole('dialog')
    expect(dialogs).toHaveLength(1)
    expect(dialogs[0]).toHaveTextContent('Vas a reemplazar el system prompt de')
    expect(dialogs[0]).toHaveTextContent('Agente de extracción')
    expect(mockedUpdate).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus()
    expect(contextTextarea.value).toBe('Draft de contextualización.')
  })
})

// ────────────────────────────────────────────────────────────────
// @s7 — Cerrar el modal sin confirmar no dispara el PUT ni altera el borrador
// ────────────────────────────────────────────────────────────────
describe('PromptsConfig — @s7 Cerrar el modal sin confirmar no dispara el PUT y devuelve el foco', () => {
  async function openModal() {
    mockedList.mockResolvedValue([
      { agentName: 'extraction_agent', systemPrompt: EXTRACTION_PROMPT },
    ])
    renderSettings()
    await waitForReady()
    const card = getCard('Agente de extracción')
    const textarea = within(card).getByLabelText<HTMLTextAreaElement>(
      'System prompt de Agente de extracción'
    )
    fireEvent.change(textarea, { target: { value: 'Draft sin guardar.' } })
    const saveButton = within(card).getByRole('button', { name: 'Guardar cambios' })
    const user = userEvent.setup()
    await user.click(saveButton)
    return { card, textarea, saveButton, user }
  }

  it('con el botón "Cancelar"', async () => {
    const { card, textarea, saveButton, user } = await openModal()
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(mockedUpdate).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(textarea.value).toBe('Draft sin guardar.')
    await waitFor(() => expect(saveButton).toHaveFocus())
    void card
  })

  it('con la tecla Escape', async () => {
    const { textarea, saveButton } = await openModal()
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })

    expect(mockedUpdate).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(textarea.value).toBe('Draft sin guardar.')
    await waitFor(() => expect(saveButton).toHaveFocus())
  })

  it('con un clic en el backdrop', async () => {
    const { textarea, saveButton } = await openModal()
    const dialog = screen.getByRole('dialog')
    const backdrop = dialog.parentElement as HTMLElement
    fireEvent.click(backdrop)

    expect(mockedUpdate).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(textarea.value).toBe('Draft sin guardar.')
    await waitFor(() => expect(saveButton).toHaveFocus())
  })
})

// ────────────────────────────────────────────────────────────────
// @s8 — Confirmar cierra el modal, analytics antes del request, actualiza baseline
// ────────────────────────────────────────────────────────────────
describe('PromptsConfig — @s8 "Sobrescribir" registra analytics antes del PUT y cierra el modal de inmediato', () => {
  it('el orden de efectos es: analytics -> cierre del modal -> PUT -> baseline actualizado', async () => {
    mockedList.mockResolvedValue([
      { agentName: 'extraction_agent', systemPrompt: EXTRACTION_PROMPT },
    ])
    let resolveUpdate!: (value: AgentPrompt) => void
    mockedUpdate.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveUpdate = resolve
        })
    )

    renderSettings()
    await waitForReady()

    const card = getCard('Agente de extracción')
    fireEvent.change(within(card).getByLabelText('System prompt de Agente de extracción'), {
      target: { value: 'Nuevo texto.' },
    })

    const user = userEvent.setup()
    await user.click(within(card).getByRole('button', { name: 'Guardar cambios' }))
    await user.click(screen.getByRole('button', { name: 'Sobrescribir' }))

    // Antes de que se resuelva la llamada al service:
    expect(mockedTrackEvent).toHaveBeenCalledWith('prompt_saved', {
      agentName: 'extraction_agent',
      promptLength: 12,
    })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(mockedUpdate).toHaveBeenCalledWith('extraction_agent', 'Nuevo texto.')

    resolveUpdate({ agentName: 'extraction_agent', systemPrompt: 'Nuevo texto.' })

    await waitFor(() => expect(within(card).getByText('Cambios guardados.')).toBeInTheDocument())
    expect(within(card).queryByText('Sin guardar')).not.toBeInTheDocument()
  })
})

// ────────────────────────────────────────────────────────────────
// @s9 — Error al guardar: feedback inline, borrador intacto
// ────────────────────────────────────────────────────────────────
describe('PromptsConfig — @s9 Error al guardar: feedback inline con aria-live, borrador intacto', () => {
  it('muestra el error en un bloque, conserva el borrador y el badge "Sin guardar"', async () => {
    mockedList.mockResolvedValue([
      { agentName: 'extraction_agent', systemPrompt: EXTRACTION_PROMPT },
    ])
    mockedUpdate.mockRejectedValue(new Error('No se pudo guardar el prompt. Intentá de nuevo.'))

    renderSettings()
    await waitForReady()

    const card = getCard('Agente de extracción')
    const textarea = within(card).getByLabelText<HTMLTextAreaElement>(
      'System prompt de Agente de extracción'
    )
    fireEvent.change(textarea, { target: { value: 'Borrador que falla al guardar.' } })

    const user = userEvent.setup()
    await user.click(within(card).getByRole('button', { name: 'Guardar cambios' }))
    await user.click(screen.getByRole('button', { name: 'Sobrescribir' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await waitFor(() =>
      expect(
        within(card).getByText('No se pudo guardar el prompt. Intentá de nuevo.')
      ).toBeInTheDocument()
    )
    const errorMessage = within(card).getByText('No se pudo guardar el prompt. Intentá de nuevo.')
    expect(errorMessage.closest('[aria-live="polite"]')).not.toBeNull()
    expect(errorMessage).toHaveClass('bg-error-container')
    expect(textarea.value).toBe('Borrador que falla al guardar.')
    expect(within(card).getByText('Sin guardar')).toBeInTheDocument()
  })
})

// ────────────────────────────────────────────────────────────────
// @s10 — Reintentar reusa "Guardar cambios" y vuelve a pasar por el modal
// ────────────────────────────────────────────────────────────────
describe('PromptsConfig — @s10 Reintentar tras un error reusa "Guardar cambios" y no bypassea el modal', () => {
  it('vuelve a abrir el modal, sin llamar a update hasta confirmar', async () => {
    mockedList.mockResolvedValue([
      { agentName: 'extraction_agent', systemPrompt: EXTRACTION_PROMPT },
    ])
    mockedUpdate.mockRejectedValueOnce(new Error('No se pudo guardar el prompt. Intentá de nuevo.'))

    renderSettings()
    await waitForReady()

    const card = getCard('Agente de extracción')
    fireEvent.change(within(card).getByLabelText('System prompt de Agente de extracción'), {
      target: { value: 'Borrador que falla primero.' },
    })

    const user = userEvent.setup()
    await user.click(within(card).getByRole('button', { name: 'Guardar cambios' }))
    await user.click(screen.getByRole('button', { name: 'Sobrescribir' }))

    await waitFor(() =>
      expect(
        within(card).getByText('No se pudo guardar el prompt. Intentá de nuevo.')
      ).toBeInTheDocument()
    )
    expect(mockedUpdate).toHaveBeenCalledTimes(1)

    await user.click(within(card).getByRole('button', { name: 'Guardar cambios' }))

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent('Agente de extracción')
    expect(mockedUpdate).toHaveBeenCalledTimes(1)

    mockedUpdate.mockResolvedValueOnce({
      agentName: 'extraction_agent',
      systemPrompt: 'Borrador que falla primero.',
    })
    await user.click(screen.getByRole('button', { name: 'Sobrescribir' }))

    await waitFor(() => expect(mockedUpdate).toHaveBeenCalledTimes(2))
    expect(mockedUpdate).toHaveBeenNthCalledWith(2, 'extraction_agent', 'Borrador que falla primero.')
  })
})
