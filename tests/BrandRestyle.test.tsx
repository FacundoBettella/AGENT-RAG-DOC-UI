import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import mainSource from '../src/main.tsx?raw'
import packageJson from '../package.json?raw'
import indexHtml from '../index.html?raw'
import App from '../src/App'
import { ASSISTANT_NAME } from '../src/features/HrChat/HrChat.constants'
import { hrService } from '../src/services/hrService'
import { promptsService } from '../src/services/promptsService'
import Sidebar from '../src/components/Sidebar'
import Loading from '../src/components/Loading'
import FaqPage from '../src/pages/FaqPage'
import { MessageBubble } from '../src/features/HrChat/components/MessageBubble/MessageBubble'
import { readDarkOverrides, readDarkTokens, readIndexCss, readLightTokens } from './brandTokens'

vi.mock('react-ga4', () => ({
  default: { initialize: vi.fn(), event: vi.fn() },
}))

vi.mock('../src/services/analyticsService', () => ({
  analyticsService: { trackEvent: vi.fn() },
}))

vi.mock('../src/services/hrService', () => ({
  hrService: { query: vi.fn() },
}))

vi.mock('../src/services/promptsService', () => ({
  promptsService: { list: vi.fn(), update: vi.fn() },
}))

const indexCss = readIndexCss()

const SRC_FILES = import.meta.glob('/src/**/*.{ts,tsx,css}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const filesMatching = (pattern: RegExp): string[] =>
  Object.entries(SRC_FILES)
    .filter(([, content]) => pattern.test(content))
    .map(([path]) => path)

const dependencies = (): string[] => {
  const pkg = JSON.parse(packageJson) as {
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
  }
  return [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})]
}

const EXPECTED: Record<string, [light: string, dark: string]> = {
  primary: ['#2e2e38', '#ffe600'],
  'primary-container': ['#2e2e38', '#3a3a47'],
  'on-primary-container': ['#ffe600', '#ffe600'],
  accent: ['#ffe600', '#ffe600'],
  'on-accent': ['#2e2e38', '#2e2e38'],
  'secondary-container': ['#e1e1e6', '#3a3a47'],
  'on-secondary-container': ['#2e2e38', '#f6f6fa'],
  error: ['#b3261e', '#ff8a80'],
  'error-container': ['#fde7e9', '#5c1f1f'],
  'on-error-container': ['#8c1d18', '#ffdad6'],
  background: ['#ffffff', '#1a1a24'],
  surface: ['#ffffff', '#1a1a24'],
  'surface-container-low': ['#f6f6fa', '#23232f'],
  'surface-container': ['#eaeaf2', '#2e2e38'],
  'surface-container-high': ['#e1e1e6', '#3a3a47'],
  'surface-container-highest': ['#d7d7de', '#474754'],
  'on-surface': ['#2e2e38', '#f6f6fa'],
  'on-surface-variant': ['#5c5c68', '#c4c4cd'],
  outline: ['#6e6e7a', '#9a9aa6'],
  'outline-variant': ['#c4c4cd', '#3a3a47'],
}

describe('brand-restyle @s1 — paleta y uso del acento', () => {
  it('light define exactamente los tokens de la tabla con sus valores', () => {
    const light = readLightTokens()
    expect(Object.keys(light).sort()).toEqual(Object.keys(EXPECTED).sort())
    for (const [name, [lightValue]] of Object.entries(EXPECTED)) {
      expect(light[name], `light ${name}`).toBe(lightValue)
    }
  })

  it('dark sobreescribe exactamente los mismos tokens con sus valores', () => {
    const dark = readDarkTokens()
    expect(Object.keys(readDarkOverrides()).sort()).toEqual(Object.keys(EXPECTED).sort())
    for (const [name, [, darkValue]] of Object.entries(EXPECTED)) {
      expect(dark[name], `dark ${name}`).toBe(darkValue)
    }
  })

  it('no define on-primary, secondary, tertiary ni tertiary-container', () => {
    for (const tokens of [readLightTokens(), readDarkTokens()]) {
      for (const removed of ['on-primary', 'secondary', 'tertiary', 'tertiary-container']) {
        expect(tokens).not.toHaveProperty(removed)
      }
    }
  })

  it('no queda ningun bg-primary ni text-on-primary en src/ (salvo los puntos de Loading)', () => {
    // Decision 14 del spec: los puntos de Loading usan bg-primary a proposito.
    expect(filesMatching(/\bbg-primary(?![-\w])/)).toEqual(['/src/components/Loading/Loading.tsx'])
    expect(filesMatching(/\btext-on-primary(?![-\w])/)).toEqual([])
  })

  it('el item activo del sidebar usa bg-accent con text-on-accent', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Sidebar />
      </MemoryRouter>,
    )
    const active = document.querySelector('a[aria-current="page"]')
    expect(active).not.toBeNull()
    expect(active).toHaveClass('bg-accent', 'text-on-accent')
  })

  it('el avatar del asistente usa bg-accent con text-on-accent; el del usuario no', () => {
    const { container, rerender } = render(
      <MessageBubble variant="assistant" authorName="Asistente" text="Hola" time="09:00" />,
    )
    expect(container.querySelector('span[aria-hidden="true"]')).toHaveClass(
      'bg-accent',
      'text-on-accent',
    )
    rerender(<MessageBubble variant="user" authorName="Ana" text="Hola" time="09:00" />)
    expect(container.querySelector('span[aria-hidden="true"]')).not.toHaveClass('bg-accent')
  })

  it('los botones de accion principales usan bg-accent con text-on-accent', () => {
    for (const path of [
      '/src/features/ContractAnalysis/components/UploadColumn/UploadColumn.tsx',
      '/src/features/HrChat/components/ChatColumn/ChatColumn.tsx',
      '/src/features/PromptsConfig/components/PromptCard/PromptCard.tsx',
      '/src/features/PromptsConfig/components/ConfirmSaveModal/ConfirmSaveModal.tsx',
      '/src/pages/RagPage.tsx',
    ]) {
      expect(SRC_FILES[path], path).toMatch(/bg-accent[^'"`]*text-on-accent/)
    }
  })
})

describe('brand-restyle @s3 — tipografia Overpass self-hosted', () => {
  it('font-sans y font-display valen Overpass con fallback del sistema', () => {
    const stack = "'Overpass', ui-sans-serif, system-ui, sans-serif"
    expect(indexCss).toContain(`--font-sans: ${stack};`)
    expect(indexCss).toContain(`--font-display: ${stack};`)
  })

  it('main.tsx importa los pesos 400, 500, 600 y 700 de @fontsource/overpass', () => {
    for (const weight of [400, 500, 600, 700]) {
      expect(mainSource).toContain(`'@fontsource/overpass/${weight}.css'`)
    }
  })

  it('no existe --font-serif ni font-serif en src/', () => {
    expect(indexCss).not.toContain('--font-serif')
    expect(filesMatching(/\bfont-serif\b/)).toEqual([])
  })

  it('package.json no declara las fuentes anteriores y si Overpass', () => {
    const deps = dependencies()
    expect(deps).not.toContain('@fontsource/inter')
    expect(deps).not.toContain('@fontsource/source-serif-4')
    expect(deps).toContain('@fontsource/overpass')
    expect(mainSource).not.toMatch(/@fontsource\/(inter|source-serif-4)/)
  })

  it('el body usa la fuente font-sans', () => {
    const body = /body\s*\{[^}]*\}/.exec(indexCss)?.[0] ?? ''
    expect(body).toContain('font-family: var(--font-sans)')
  })
})

describe('brand-restyle @s4 — esquinas rectas salvo circulares', () => {
  const RADIUS_STEPS = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl']

  it('todos los tokens --radius-* de xs a 4xl valen 0', () => {
    for (const step of RADIUS_STEPS) {
      expect(indexCss, `--radius-${step}`).toMatch(new RegExp(`--radius-${step}:\\s*0\\s*;`))
    }
  })

  it('no redefine --radius-full: rounded-full conserva su radio circular', () => {
    expect(indexCss).not.toContain('--radius-full')
    expect(filesMatching(/\brounded-full\b/).length).toBeGreaterThan(0)
  })

  it('no queda ninguna clase rounded sin sufijo en src/', () => {
    const bareRounded = /(?<![\w.$-])rounded(?=[\s'"`])(?!\s*=)/
    expect(filesMatching(bareRounded)).toEqual([])
  })
})

describe('brand-restyle @s5 — FaqPage y Loading en Tailwind', () => {
  const renderFaq = () =>
    render(
      <MemoryRouter>
        <FaqPage />
      </MemoryRouter>,
    )

  it('el titulo de FAQ tiene text-primary y font-display', () => {
    renderFaq()
    expect(screen.getByRole('heading', { level: 1 })).toHaveClass('text-primary', 'font-display')
  })

  it('el link volver pasa a primary en hover y pregunta/respuesta usan on-surface(-variant)', () => {
    renderFaq()
    expect(screen.getByRole('link', { name: /volver al chat/i })).toHaveClass(
      'text-on-surface-variant',
      'hover:text-primary',
    )
    expect(screen.getAllByRole('heading', { level: 2 })[0]).toHaveClass('text-on-surface')
    expect(screen.getByText(/políticas de licencias/i)).toHaveClass('text-on-surface-variant')
  })

  it('los puntos de Loading tienen bg-primary, rounded-full, animate-bounce y delays 0/0.2s/0.4s', () => {
    render(<Loading />)
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Cargando')
    const dots = screen.getAllByTestId('loading-dot')
    expect(dots).toHaveLength(3)
    dots.forEach((dot) => expect(dot).toHaveClass('bg-primary', 'rounded-full', 'animate-bounce'))
    expect(dots[0]).toHaveClass('[animation-delay:0s]')
    expect(dots[1]).toHaveClass('[animation-delay:0.2s]')
    expect(dots[2]).toHaveClass('[animation-delay:0.4s]')
  })

  it('no existen GlobalStyles.ts, FaqPage.styles.ts ni Loading.styles.ts', () => {
    const paths = Object.keys(SRC_FILES)
    expect(paths.filter((p) => /GlobalStyles|\.styles\.ts$/.test(p))).toEqual([])
  })

  it('package.json no declara styled-components ni su tipado, y src no lo importa', () => {
    const deps = dependencies()
    expect(deps).not.toContain('styled-components')
    expect(deps).not.toContain('@types/styled-components')
    expect(filesMatching(/styled-components/)).toEqual([])
  })

  it('no queda ningun var(--color-gold) ni var(--color-text-) en src/', () => {
    expect(filesMatching(/var\(--color-gold/)).toEqual([])
    expect(filesMatching(/var\(--color-text-/)).toEqual([])
  })
})

const BRAND = 'Workspace AI'

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )

describe('brand-restyle @s7 — la app se llama Workspace AI y no hay caduceo', () => {
  it.each([
    ['chat', '/'],
    ['FAQ', '/faq'],
    ['contratos', '/contracts'],
    ['prompts', '/settings'],
    ['RAG', '/rag'],
  ])('en la ruta %s el enlace de marca muestra el nombre, conserva destino y aria-label', (_name, path) => {
    vi.mocked(promptsService.list).mockReturnValue(new Promise(() => undefined))
    const { container } = renderAt(path)
    const link = screen.getByRole('link', { name: 'Ir al chat' })
    expect(link).toHaveTextContent(BRAND)
    expect(link).toHaveAttribute('href', '/')
    expect(link).toHaveAttribute('aria-label', 'Ir al chat')
    const sidebar = screen.getByRole('navigation', { name: /navegación principal/i })
    expect(sidebar.textContent).not.toContain('⚕')
    expect(screen.queryByLabelText('Caduceo de Hermes')).toBeNull()
    expect(container.textContent?.toLowerCase()).not.toContain('mercurial')
  })

  it('el saludo del chat empieza con "¡Hola! Soy el asistente de Workspace AI."', () => {
    renderAt('/')
    expect(
      screen.getByText(/^¡Hola! Soy el asistente de Workspace AI\./),
    ).toBeInTheDocument()
  })

  it('el texto de procesando es "Workspace AI está procesando tu consulta"', async () => {
    vi.mocked(hrService.query).mockReturnValue(new Promise(() => undefined))
    const user = userEvent.setup()
    renderAt('/')
    await user.type(screen.getByRole('textbox', { name: 'Escribe tu pregunta' }), 'hola')
    await user.keyboard('{Enter}')
    expect(await screen.findByText('Workspace AI está procesando tu consulta')).toBeInTheDocument()
  })

  it('las respuestas de FAQ de busqueda y de respuesta desconocida empiezan con el nombre', () => {
    renderAt('/faq')
    const searchAnswer = screen.getByText(/Retrieval-Augmented Generation/)
    expect(searchAnswer.textContent?.startsWith(BRAND)).toBe(true)
    const unknownAnswer = screen.getByText(/no encontró información suficiente/)
    expect(unknownAnswer.textContent?.startsWith(BRAND)).toBe(true)
  })

  it('el <title> de index.html es "Workspace AI" y no menciona Mercurial', () => {
    expect(indexHtml).toMatch(/<title>Workspace AI<\/title>/)
    expect(indexHtml.toLowerCase()).not.toContain('mercurial')
  })
})

describe('brand-restyle @s8 — el asistente se identifica solo como "Asistente"', () => {
  it('ASSISTANT_NAME vale "Asistente" y no contiene el nombre de la app', () => {
    expect(ASSISTANT_NAME).toBe('Asistente')
    expect(ASSISTANT_NAME).not.toContain(BRAND)
  })

  it('el encabezado del mensaje del asistente muestra "Asistente · <hora>"', () => {
    render(
      <MessageBubble variant="assistant" authorName={ASSISTANT_NAME} text="Hola" time="09:05" />,
    )
    expect(screen.getByText('Asistente · 09:05')).toBeInTheDocument()
  })
})

describe('brand-restyle @s9 — favicon propio de robot', () => {
  const favicon = readFileSync(resolve(process.cwd(), 'public/favicon.svg'), 'utf-8')

  it('index.html referencia /favicon.svg como image/svg+xml y no vite.svg', () => {
    expect(indexHtml).toMatch(
      /<link\s+rel="icon"\s+type="image\/svg\+xml"\s+href="\/favicon\.svg"\s*\/>/,
    )
    expect(indexHtml).not.toContain('vite.svg')
  })

  it('public/favicon.svg es un SVG bien formado', () => {
    const doc = new DOMParser().parseFromString(favicon, 'image/svg+xml')
    expect(doc.getElementsByTagName('parsererror')).toHaveLength(0)
    expect(doc.documentElement.tagName).toBe('svg')
    expect(doc.documentElement.getAttribute('xmlns')).toBe('http://www.w3.org/2000/svg')
  })

  it('el favicon usa el amarillo #FFE600 de relleno y el carbon #2E2E38 de contorno', () => {
    expect(favicon).toMatch(/fill="#FFE600"/i)
    expect(favicon).toMatch(/stroke="#2E2E38"/i)
  })
})
