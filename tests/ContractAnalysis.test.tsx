import { render, screen, fireEvent, waitFor, renderHook, act, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ContractsPage from '../src/pages/ContractsPage'

vi.mock('../src/services/docAgentService', () => ({
  docAgentService: { analyze: vi.fn() },
}))

vi.mock('../src/services/analyticsService', () => ({
  analyticsService: { trackEvent: vi.fn() },
}))

import { docAgentService } from '../src/services/docAgentService'
import { analyticsService } from '../src/services/analyticsService'
import { useContractAnalysis } from '../src/hooks/useContractAnalysis'

const mockedAnalyze = vi.mocked(docAgentService.analyze)
const mockedTrackEvent = vi.mocked(analyticsService.trackEvent)

function makeImageFile(name = 'contrato.png', sizeBytes = 100, type = 'image/png'): File {
  const content = new Uint8Array(sizeBytes)
  return new File([content], name, { type })
}

function makeDocxFile(
  name = 'contrato.docx',
  sizeBytes = 100,
  type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
): File {
  const content = new Uint8Array(sizeBytes)
  return new File([content], name, { type })
}

function selectFiles(input: HTMLElement, files: File[]) {
  Object.defineProperty(input, 'files', { value: files, configurable: true })
  fireEvent.change(input)
}

function dropFiles(dropZone: HTMLElement, files: File[]) {
  const dataTransfer = { files, types: ['Files'] }
  fireEvent.dragOver(dropZone, { dataTransfer })
  fireEvent.drop(dropZone, { dataTransfer })
}

// El <label> visible (no el <input> sr-only) es el verdadero destino del drag & drop.
function getDropzoneLabel(inputLabelText: string): HTMLElement {
  const input = screen.getByLabelText(inputLabelText)
  const label = input.closest('label')
  if (!label) throw new Error(`No se encontró el <label> de la dropzone "${inputLabelText}"`)
  return label
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ────────────────────────────────────────────────────────────────
// @s5 — Rechaza extensión no soportada sin reemplazar el archivo válido
// ────────────────────────────────────────────────────────────────
describe('ContractAnalysis — @s5 Rechaza extensión no soportada sin reemplazar el archivo válido ya cargado', () => {
  it('muestra el error, mantiene el archivo válido y no llama a docAgentService.analyze', async () => {
    render(<ContractsPage />)
    const originalInput = screen.getByLabelText('Contrato original') as HTMLInputElement
    selectFiles(originalInput, [makeImageFile('contrato.png')])
    expect(screen.getByText('contrato.png')).toBeInTheDocument()

    // El input sigue montado en el mismo lugar del árbol aunque la dropzone ya tenga un
    // archivo cargado, así que el usuario puede intentar reemplazarlo directamente.
    selectFiles(originalInput, [makeImageFile('contrato.pdf', 100, 'application/pdf')])

    expect(
      screen.getByText('Formato no soportado. Subí un archivo .png, .jpg, .jpeg o .docx.')
    ).toBeInTheDocument()
    expect(screen.getByText('contrato.png')).toBeInTheDocument()
    expect(mockedAnalyze).not.toHaveBeenCalled()
  })
})

// ────────────────────────────────────────────────────────────────
// @s6 — Rechaza una imagen que supera los 10 MB
// ────────────────────────────────────────────────────────────────
describe('ContractAnalysis — @s6 Rechaza una imagen que supera los 10 MB', () => {
  it('muestra el error de tamaño, la dropzone queda vacía y no se llama al service', () => {
    render(<ContractsPage />)
    const amendmentInput = screen.getByLabelText('Enmienda') as HTMLInputElement
    const bigFile = makeImageFile('enmienda.jpg', 11 * 1024 * 1024, 'image/jpeg')
    selectFiles(amendmentInput, [bigFile])

    expect(screen.getByText('El archivo supera el límite de 10 MB.')).toBeInTheDocument()
    expect(screen.queryByText('enmienda.jpg')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Enmienda')).toBeInTheDocument()
    expect(mockedAnalyze).not.toHaveBeenCalled()
  })
})

// ────────────────────────────────────────────────────────────────
// @s7 — Botón deshabilitado mientras falte alguno de los dos archivos
// ────────────────────────────────────────────────────────────────
describe('ContractAnalysis — @s7 El botón "Analizar documentos" permanece deshabilitado con un solo archivo', () => {
  it('el botón está deshabilitado y no se llama al service', () => {
    render(<ContractsPage />)
    const originalInput = screen.getByLabelText('Contrato original') as HTMLInputElement
    selectFiles(originalInput, [makeImageFile('contrato.png')])

    expect(screen.getByRole('button', { name: /analizar documentos/i })).toBeDisabled()
    expect(mockedAnalyze).not.toHaveBeenCalled()
  })
})

// ────────────────────────────────────────────────────────────────
// @s8 — El error inline se limpia al aceptar un archivo válido
// ────────────────────────────────────────────────────────────────
describe('ContractAnalysis — @s8 El error inline de una dropzone se limpia al aceptar un archivo válido', () => {
  it('el mensaje de error desaparece y el archivo válido se muestra', () => {
    render(<ContractsPage />)
    const amendmentInput = screen.getByLabelText('Enmienda') as HTMLInputElement
    selectFiles(amendmentInput, [makeImageFile('enmienda.jpg', 11 * 1024 * 1024, 'image/jpeg')])
    expect(screen.getByText('El archivo supera el límite de 10 MB.')).toBeInTheDocument()

    selectFiles(amendmentInput, [makeImageFile('enmienda.png', 2 * 1024 * 1024)])

    expect(screen.queryByText('El archivo supera el límite de 10 MB.')).not.toBeInTheDocument()
    expect(screen.getByText('enmienda.png')).toBeInTheDocument()
  })
})

// ────────────────────────────────────────────────────────────────
// @s9 — Estado inicial (idle)
// ────────────────────────────────────────────────────────────────
describe('ContractAnalysis — @s9 Estado inicial (idle)', () => {
  it('el panel es una región aria-live="polite" con título y los dos pasos', () => {
    render(<ContractsPage />)
    const panel = screen.getByRole('region', { name: /estado del análisis/i })
    expect(panel).toHaveAttribute('aria-live', 'polite')
    expect(screen.getByText('Inteligencia analítica')).toBeInTheDocument()
    expect(screen.getByText('01 Lectura de los documentos')).toBeInTheDocument()
    expect(screen.getByText('02 Detección de cambios')).toBeInTheDocument()
  })
})

// ────────────────────────────────────────────────────────────────
// @s10 — Estado de carga
// ────────────────────────────────────────────────────────────────
describe('ContractAnalysis — @s10 Estado de carga: spinner y texto fijo, sin barra de progreso', () => {
  it('muestra el texto de carga, la nota, ningún progressbar, y el botón deshabilitado como "Analizando…"', async () => {
    mockedAnalyze.mockReturnValue(new Promise(() => undefined))
    const user = userEvent.setup()
    render(<ContractsPage />)

    selectFiles(screen.getByLabelText('Contrato original'), [makeImageFile('contrato.png')])
    selectFiles(screen.getByLabelText('Enmienda'), [makeImageFile('enmienda.png')])

    await user.click(screen.getByRole('button', { name: /analizar documentos/i }))

    expect(screen.getByText('Analizando documentos…')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Puede tardar hasta un minuto: se leen los dos documentos y después se comparan.'
      )
    ).toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /analizando…/i })).toBeDisabled()
  })
})

// ────────────────────────────────────────────────────────────────
// @s11 — Estado de error
// ────────────────────────────────────────────────────────────────
describe('ContractAnalysis — @s11 Estado de error: mensaje del backend y botón "Reintentar"', () => {
  it('muestra el mensaje de error y el botón Reintentar', async () => {
    mockedAnalyze.mockRejectedValue(
      new Error('No se pudieron analizar los documentos. Intentá de nuevo.')
    )
    const user = userEvent.setup()
    render(<ContractsPage />)

    selectFiles(screen.getByLabelText('Contrato original'), [makeImageFile('contrato.png')])
    selectFiles(screen.getByLabelText('Enmienda'), [makeImageFile('enmienda.png')])
    await user.click(screen.getByRole('button', { name: /analizar documentos/i }))

    await waitFor(() =>
      expect(
        screen.getByText('No se pudieron analizar los documentos. Intentá de nuevo.')
      ).toBeInTheDocument()
    )
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument()
  })
})

// ────────────────────────────────────────────────────────────────
// @s12 — "Reintentar" reenvía el análisis con los mismos dos archivos
// ────────────────────────────────────────────────────────────────
describe('ContractAnalysis — @s12 "Reintentar" reenvía el análisis con los mismos dos archivos', () => {
  it('llama a docAgentService.analyze de nuevo con los mismos archivos', async () => {
    mockedAnalyze.mockRejectedValueOnce(new Error('Fallo del backend.'))
    const user = userEvent.setup()
    render(<ContractsPage />)

    const original = makeImageFile('contrato.png')
    const amendment = makeImageFile('enmienda.png')
    selectFiles(screen.getByLabelText('Contrato original'), [original])
    selectFiles(screen.getByLabelText('Enmienda'), [amendment])
    await user.click(screen.getByRole('button', { name: /analizar documentos/i }))

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument()
    )

    mockedAnalyze.mockResolvedValueOnce({
      sectionsChanged: ['Cláusula 1'],
      topicsTouched: ['Monto'],
      summary: 'Cambio detectado.',
    })
    await user.click(screen.getByRole('button', { name: /reintentar/i }))

    await waitFor(() => expect(mockedAnalyze).toHaveBeenCalledTimes(2))
    expect(mockedAnalyze).toHaveBeenNthCalledWith(2, original, amendment)
  })
})

// ────────────────────────────────────────────────────────────────
// @s13 — Estado de éxito
// ────────────────────────────────────────────────────────────────
describe('ContractAnalysis — @s13 Estado de éxito: resumen antes que las listas, archivos persisten, se registra analytics', () => {
  it('el resumen aparece antes que la lista de secciones y los chips de temas', async () => {
    mockedAnalyze.mockResolvedValue({
      sectionsChanged: ['Cláusula 4.2 - Plazo'],
      topicsTouched: ['Monto'],
      summary: 'El monto se actualizó.',
    })
    const user = userEvent.setup()
    render(<ContractsPage />)

    selectFiles(screen.getByLabelText('Contrato original'), [
      makeImageFile('original.png', 1_500_000),
    ])
    selectFiles(screen.getByLabelText('Enmienda'), [makeImageFile('enmienda.png', 2_000_000)])
    await user.click(screen.getByRole('button', { name: /analizar documentos/i }))

    await waitFor(() => expect(screen.getByText('El monto se actualizó.')).toBeInTheDocument())

    const summaryNode = screen.getByText('El monto se actualizó.')
    const sectionNode = screen.getByText('Cláusula 4.2 - Plazo')
    const topicNode = screen.getByText('Monto')

    // eslint-disable-next-line no-bitwise
    expect(
      summaryNode.compareDocumentPosition(sectionNode) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    // eslint-disable-next-line no-bitwise
    expect(
      summaryNode.compareDocumentPosition(topicNode) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it('las dropzones siguen mostrando sus archivos tras el análisis', async () => {
    mockedAnalyze.mockResolvedValue({
      sectionsChanged: ['Cláusula 4.2 - Plazo'],
      topicsTouched: ['Monto'],
      summary: 'El monto se actualizó.',
    })
    const user = userEvent.setup()
    render(<ContractsPage />)

    selectFiles(screen.getByLabelText('Contrato original'), [
      makeImageFile('original.png', 1_500_000),
    ])
    selectFiles(screen.getByLabelText('Enmienda'), [makeImageFile('enmienda.png', 2_000_000)])
    await user.click(screen.getByRole('button', { name: /analizar documentos/i }))

    await waitFor(() => expect(screen.getByText('El monto se actualizó.')).toBeInTheDocument())

    expect(screen.getByText('original.png')).toBeInTheDocument()
    expect(screen.getByText('enmienda.png')).toBeInTheDocument()
  })

  it('registra el evento contract_analysis_submitted con el tamaño de cada archivo', async () => {
    mockedAnalyze.mockResolvedValue({
      sectionsChanged: ['Cláusula 4.2 - Plazo'],
      topicsTouched: ['Monto'],
      summary: 'El monto se actualizó.',
    })
    const user = userEvent.setup()
    render(<ContractsPage />)

    selectFiles(screen.getByLabelText('Contrato original'), [
      makeImageFile('original.png', 1_500_000),
    ])
    selectFiles(screen.getByLabelText('Enmienda'), [makeImageFile('enmienda.png', 2_000_000)])
    await user.click(screen.getByRole('button', { name: /analizar documentos/i }))

    expect(mockedTrackEvent).toHaveBeenCalledWith('contract_analysis_submitted', {
      originalSizeBytes: 1_500_000,
      amendmentSizeBytes: 2_000_000,
    })
  })
})

// ────────────────────────────────────────────────────────────────
// @s14 — Reemplazar un archivo tras el éxito no borra el resultado visible
// ────────────────────────────────────────────────────────────────
describe('ContractAnalysis — @s14 Reemplazar uno de los archivos tras el éxito no borra el resultado', () => {
  it('el resultado anterior sigue visible al quitar y volver a cargar un archivo', async () => {
    mockedAnalyze.mockResolvedValue({
      sectionsChanged: ['Cláusula 4.2 - Plazo'],
      topicsTouched: ['Monto'],
      summary: 'El monto se actualizó.',
    })
    const user = userEvent.setup()
    render(<ContractsPage />)

    selectFiles(screen.getByLabelText('Contrato original'), [makeImageFile('original.png')])
    selectFiles(screen.getByLabelText('Enmienda'), [makeImageFile('enmienda.png')])
    await user.click(screen.getByRole('button', { name: /analizar documentos/i }))
    await waitFor(() => expect(screen.getByText('El monto se actualizó.')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: 'Quitar enmienda.png' }))
    selectFiles(screen.getByLabelText('Enmienda'), [makeImageFile('enmienda-v2.png')])

    expect(screen.getByText('El monto se actualizó.')).toBeInTheDocument()
  })
})

// ────────────────────────────────────────────────────────────────
// @s15 — Enviar un nuevo análisis descarta el resultado o error anterior
// ────────────────────────────────────────────────────────────────
describe('ContractAnalysis — @s15 Enviar un nuevo análisis descarta el resultado o error anterior', () => {
  it('al reenviar, el panel pasa a loading y el resultado anterior deja de mostrarse', async () => {
    mockedAnalyze.mockResolvedValueOnce({
      sectionsChanged: ['Cláusula 4.2 - Plazo'],
      topicsTouched: ['Monto'],
      summary: 'El monto se actualizó.',
    })
    const user = userEvent.setup()
    render(<ContractsPage />)

    selectFiles(screen.getByLabelText('Contrato original'), [makeImageFile('original.png')])
    selectFiles(screen.getByLabelText('Enmienda'), [makeImageFile('enmienda.png')])
    await user.click(screen.getByRole('button', { name: /analizar documentos/i }))
    await waitFor(() => expect(screen.getByText('El monto se actualizó.')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: 'Quitar enmienda.png' }))
    selectFiles(screen.getByLabelText('Enmienda'), [makeImageFile('enmienda-v2.png')])

    mockedAnalyze.mockReturnValue(new Promise(() => undefined))
    await user.click(screen.getByRole('button', { name: /analizar documentos/i }))

    expect(screen.getByText('Analizando documentos…')).toBeInTheDocument()
    expect(screen.queryByText('El monto se actualizó.')).not.toBeInTheDocument()
  })
})

describe('ContractAnalysis — @s15 (hook) result y error se descartan al arrancar un nuevo análisis', () => {
  it('useContractAnalysis pone result y error en null apenas se llama a submit()', async () => {
    mockedAnalyze.mockResolvedValueOnce({
      sectionsChanged: ['Cláusula 1'],
      topicsTouched: ['Monto'],
      summary: 'Primer resultado.',
    })
    const { result } = renderHook(() => useContractAnalysis())

    act(() => {
      result.current.selectOriginal(makeImageFile('original.png'))
    })
    act(() => {
      result.current.selectAmendment(makeImageFile('enmienda.png'))
    })
    act(() => {
      result.current.submit()
    })
    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(result.current.result).not.toBeNull()

    let resolveSecond!: (value: {
      sectionsChanged: string[]
      topicsTouched: string[]
      summary: string
    }) => void
    mockedAnalyze.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveSecond = resolve
      })
    )

    act(() => {
      result.current.submit()
    })

    // Apenas arranca el segundo análisis (antes de que resuelva), result debe estar en null.
    expect(result.current.result).toBeNull()
    expect(result.current.status).toBe('loading')

    resolveSecond({ sectionsChanged: ['Cláusula 2'], topicsTouched: ['Plazo'], summary: 'Segundo.' })
    await waitFor(() => expect(result.current.status).toBe('success'))
  })
})

// ────────────────────────────────────────────────────────────────
// Drag & drop — paridad con rag-form-v2 (Decisión 16)
// ────────────────────────────────────────────────────────────────
describe('ContractAnalysis — drag & drop carga un archivo válido', () => {
  it('soltar un archivo válido sobre la dropzone lo carga', () => {
    render(<ContractsPage />)
    const dropZone = getDropzoneLabel('Contrato original')
    dropFiles(dropZone, [makeImageFile('arrastrado.png')])
    expect(screen.getByText('arrastrado.png')).toBeInTheDocument()
  })

  it('el borde resalta con data-dragging="true" durante dragover y se revierte en dragleave', () => {
    render(<ContractsPage />)
    const dropZone = getDropzoneLabel('Contrato original')
    fireEvent.dragOver(dropZone, { dataTransfer: { files: [], types: ['Files'] } })
    expect(dropZone).toHaveAttribute('data-dragging', 'true')
    fireEvent.dragLeave(dropZone)
    expect(dropZone).not.toHaveAttribute('data-dragging', 'true')
  })
})

// ────────────────────────────────────────────────────────────────
// Soporte de .docx (contract-analysis-docx-support)
// ────────────────────────────────────────────────────────────────

// El ícono del estado "con archivo" está en el primer <span class="material-symbols-outlined">
// dentro del <label> de la dropzone (antes del nombre y del botón "Quitar").
function getFileIconText(inputLabelText: string): string | null {
  const label = getDropzoneLabel(inputLabelText)
  const icon = label.querySelector('.material-symbols-outlined')
  return icon ? icon.textContent : null
}

// @s1 — Acepta un archivo .docx válido en la dropzone
describe('ContractAnalysis — @s1 Acepta un archivo .docx válido en la dropzone', () => {
  it('carga el archivo .docx y no muestra error', () => {
    render(<ContractsPage />)
    const originalInput = screen.getByLabelText('Contrato original') as HTMLInputElement
    selectFiles(originalInput, [makeDocxFile('contrato.docx', 2 * 1024 * 1024)])

    expect(screen.getByText('contrato.docx')).toBeInTheDocument()
    expect(
      screen.queryByText('Formato no soportado. Subí un archivo .png, .jpg, .jpeg o .docx.')
    ).not.toBeInTheDocument()
  })
})

// @s2 — El ícono del archivo cargado depende del tipo; original y enmienda pueden diferir
describe('ContractAnalysis — @s2 El ícono del archivo cargado depende del tipo, y original y enmienda pueden ser de tipos distintos', () => {
  it('muestra "description" para el .docx y "image" para el .png, sin errores', () => {
    render(<ContractsPage />)
    selectFiles(screen.getByLabelText('Contrato original'), [makeDocxFile('contrato.docx')])
    selectFiles(screen.getByLabelText('Enmienda'), [makeImageFile('enmienda.png')])

    expect(getFileIconText('Contrato original')).toBe('description')
    expect(getFileIconText('Enmienda')).toBe('image')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

// @s3 — Rechaza un archivo .doc legado con el mensaje de error actualizado
describe('ContractAnalysis — @s3 Rechaza un archivo .doc legado con el mensaje de error actualizado', () => {
  it('muestra el mensaje de formato no soportado, la dropzone queda vacía y no se llama al service', () => {
    render(<ContractsPage />)
    const originalInput = screen.getByLabelText('Contrato original') as HTMLInputElement
    selectFiles(originalInput, [
      makeImageFile('contrato.doc', 100, 'application/msword'),
    ])

    expect(
      screen.getByText('Formato no soportado. Subí un archivo .png, .jpg, .jpeg o .docx.')
    ).toBeInTheDocument()
    expect(screen.queryByText('contrato.doc')).not.toBeInTheDocument()
    expect(mockedAnalyze).not.toHaveBeenCalled()
  })
})

// @s4 — El límite de 10 MB también aplica a los archivos .docx
describe('ContractAnalysis — @s4 El límite de 10 MB también aplica a los archivos .docx', () => {
  it('muestra el mensaje de tamaño, la dropzone queda vacía y no se llama al service', () => {
    render(<ContractsPage />)
    const amendmentInput = screen.getByLabelText('Enmienda') as HTMLInputElement
    selectFiles(amendmentInput, [makeDocxFile('enmienda.docx', 11 * 1024 * 1024)])

    expect(screen.getByText('El archivo supera el límite de 10 MB.')).toBeInTheDocument()
    expect(screen.queryByText('enmienda.docx')).not.toBeInTheDocument()
    expect(mockedAnalyze).not.toHaveBeenCalled()
  })
})

// @s5 — La pista de la dropzone comunica los formatos soportados incluyendo DOCX
describe('ContractAnalysis — @s5 La pista de la dropzone comunica los formatos soportados incluyendo DOCX', () => {
  it('muestra el texto "PNG, JPG o DOCX (máx. 10 MB)" en la dropzone "Contrato original"', () => {
    render(<ContractsPage />)
    const dropZone = getDropzoneLabel('Contrato original')
    expect(within(dropZone).getByText('PNG, JPG o DOCX (máx. 10 MB)')).toBeInTheDocument()
  })
})
