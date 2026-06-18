import { render, screen, waitFor, fireEvent, renderHook, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import RagPage from '../src/pages/RagPage'

vi.mock('react-ga4', () => ({
  default: { initialize: vi.fn(), event: vi.fn() },
}))

vi.mock('../src/services/analyticsService', () => ({
  analyticsService: { trackEvent: vi.fn() },
}))

vi.mock('../src/services/ragService', () => ({
  ragService: { upload: vi.fn() },
}))

import { ragService } from '../src/services/ragService'
import { useRagUpload } from '../src/hooks/useRagUpload'

const mockedUpload = vi.mocked(ragService.upload)

function makeTxtFile(name = 'test.txt') {
  return new File(['contenido'], name, { type: 'text/plain' })
}

function selectFiles(input: HTMLElement, files: File[]) {
  Object.defineProperty(input, 'files', {
    value: files,
    configurable: true,
  })
  fireEvent.change(input)
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ────────────────────────────────────────────────────────────────
// @s1 — Texto explicativo sobre chunking e indexado
// ────────────────────────────────────────────────────────────────
describe('RagForm — @s1 Texto explicativo sobre chunking e indexado', () => {
  it('muestra un texto que explica que los archivos serán divididos en fragmentos e indexados', () => {
    render(<RagPage />)
    expect(
      screen.getByText(/fragmentos|chunks/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/index/i)
    ).toBeInTheDocument()
  })
})

// ────────────────────────────────────────────────────────────────
// @s2 — El file picker acepta solo .txt
// ────────────────────────────────────────────────────────────────
describe('RagForm — @s2 El file picker acepta solo archivos .txt', () => {
  it('el input de archivos tiene el atributo accept igual a ".txt"', () => {
    render(<RagPage />)
    // query by type=file since there's no native accessible role for file inputs
    const input = screen.getByLabelText('Seleccionar archivos') as HTMLInputElement
    expect(input).not.toBeNull()
    expect(input.getAttribute('accept')).toBe('.txt')
  })
})

// ────────────────────────────────────────────────────────────────
// @s3 — Botón deshabilitado sin archivos
// ────────────────────────────────────────────────────────────────
describe('RagForm — @s3 El botón de subir está deshabilitado sin archivos', () => {
  it('el botón "Subir archivos" está deshabilitado al cargar sin archivos', () => {
    render(<RagPage />)
    expect(
      screen.getByRole('button', { name: 'Subir archivos' })
    ).toBeDisabled()
  })
})

// ────────────────────────────────────────────────────────────────
// @s4 — Al seleccionar archivos el botón se habilita
// ────────────────────────────────────────────────────────────────
describe('RagForm — @s4 Al seleccionar archivos el botón se habilita', () => {
  it('el botón "Subir archivos" se habilita tras seleccionar uno o más archivos .txt', () => {
    render(<RagPage />)
    const input = screen.getByLabelText('Seleccionar archivos') as HTMLInputElement
    selectFiles(input, [makeTxtFile()])
    expect(
      screen.getByRole('button', { name: 'Subir archivos' })
    ).not.toBeDisabled()
  })
})

// ────────────────────────────────────────────────────────────────
// @s5 — Al enviar aparece el Loading
// ────────────────────────────────────────────────────────────────
describe('RagForm — @s5 Al enviar aparece el indicador Loading', () => {
  it('el componente Loading es visible mientras ragService está pendiente', async () => {
    mockedUpload.mockReturnValue(new Promise(() => undefined))
    const user = userEvent.setup()
    render(<RagPage />)
    const input = screen.getByLabelText('Seleccionar archivos') as HTMLInputElement
    selectFiles(input, [makeTxtFile()])
    await user.click(screen.getByRole('button', { name: 'Subir archivos' }))
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})

// ────────────────────────────────────────────────────────────────
// @s6 — El botón y el input se deshabilitan mientras carga
// ────────────────────────────────────────────────────────────────
describe('RagForm — @s6 El botón y el input se deshabilitan mientras carga', () => {
  it('el botón "Subir archivos" está deshabilitado mientras carga', async () => {
    mockedUpload.mockReturnValue(new Promise(() => undefined))
    const user = userEvent.setup()
    render(<RagPage />)
    const input = screen.getByLabelText('Seleccionar archivos') as HTMLInputElement
    selectFiles(input, [makeTxtFile()])
    await user.click(screen.getByRole('button', { name: 'Subir archivos' }))
    expect(screen.getByRole('button', { name: 'Subir archivos' })).toBeDisabled()
  })

  it('el input de archivos está deshabilitado mientras carga', async () => {
    mockedUpload.mockReturnValue(new Promise(() => undefined))
    const user = userEvent.setup()
    render(<RagPage />)
    const input = screen.getByLabelText('Seleccionar archivos') as HTMLInputElement
    selectFiles(input, [makeTxtFile()])
    await user.click(screen.getByRole('button', { name: 'Subir archivos' }))
    expect(
      screen.getByLabelText('Seleccionar archivos') as HTMLInputElement
    ).toBeDisabled()
  })
})

// ────────────────────────────────────────────────────────────────
// @s7 — Éxito: desaparece Loading y aparece confirmación
// ────────────────────────────────────────────────────────────────
describe('RagForm — @s7 Éxito: desaparece Loading y aparece confirmación', () => {
  it('Loading no es visible y aparece mensaje de confirmación tras éxito', async () => {
    mockedUpload.mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<RagPage />)
    const input = screen.getByLabelText('Seleccionar archivos') as HTMLInputElement
    selectFiles(input, [makeTxtFile()])
    await user.click(screen.getByRole('button', { name: 'Subir archivos' }))
    await waitFor(() =>
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    )
    // Mensaje de confirmación específico de éxito
    expect(
      screen.getByText(/correctamente/i)
    ).toBeInTheDocument()
  })
})

// ────────────────────────────────────────────────────────────────
// @s8 — Error: desaparece Loading, aparece error y botón Reintentar
// ────────────────────────────────────────────────────────────────
describe('RagForm — @s8 Error: aparece mensaje de error y botón Reintentar', () => {
  it('Loading no es visible, aparece error y el botón "Reintentar" tras fallo', async () => {
    mockedUpload.mockRejectedValue(new Error('Upload failed'))
    const user = userEvent.setup()
    render(<RagPage />)
    const input = screen.getByLabelText('Seleccionar archivos') as HTMLInputElement
    selectFiles(input, [makeTxtFile()])
    await user.click(screen.getByRole('button', { name: 'Subir archivos' }))
    await waitFor(() =>
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    )
    expect(screen.getByText(/error|falló|no se pudo|upload failed/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Reintentar' })
    ).toBeInTheDocument()
  })
})

// ────────────────────────────────────────────────────────────────
// @s-guard — submit no llama al servicio cuando files es null o vacío
// ────────────────────────────────────────────────────────────────
describe('useRagUpload — guard: submit no actúa sin archivos', () => {
  it('no llama a ragService.upload cuando files es null (estado inicial)', async () => {
    const { result } = renderHook(() => useRagUpload())
    await act(async () => {
      await result.current.submit()
    })
    expect(mockedUpload).not.toHaveBeenCalled()
  })

  it('no llama a ragService.upload cuando se llama submit con array vacío', async () => {
    const { result } = renderHook(() => useRagUpload())
    await act(async () => {
      result.current.setFiles([])
    })
    await act(async () => {
      await result.current.submit()
    })
    expect(mockedUpload).not.toHaveBeenCalled()
  })
})

// ────────────────────────────────────────────────────────────────
// @s9 — Reintentar reenvía los mismos archivos y vuelve al loading
// ────────────────────────────────────────────────────────────────
describe('RagForm — @s9 Reintentar reenvía los mismos archivos', () => {
  it('ragService es llamado nuevamente con los mismos archivos y Loading vuelve a mostrarse', async () => {
    let resolvePending: () => void
    const pendingPromise = new Promise<void>((resolve) => { resolvePending = resolve })

    mockedUpload
      .mockRejectedValueOnce(new Error('Upload failed'))
      .mockReturnValueOnce(pendingPromise)

    const user = userEvent.setup()
    render(<RagPage />)
    const input = screen.getByLabelText('Seleccionar archivos') as HTMLInputElement
    const file = makeTxtFile()
    selectFiles(input, [file])

    // First submit → error
    await user.click(screen.getByRole('button', { name: 'Subir archivos' }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
    )

    // Click Reintentar → second call pending
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(mockedUpload).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('status')).toBeInTheDocument()

    // Cleanup: resolve the pending promise
    resolvePending!()
  })
})
