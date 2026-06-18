import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Loading from '../src/components/Loading/Loading'

describe('Loading — @s10 El componente Loading muestra puntos animados accesibles', () => {
  it('existe un elemento con role "status" que comunica el estado de carga', () => {
    render(<Loading />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('el elemento status tiene aria-label "Cargando"', () => {
    render(<Loading />)
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Cargando')
  })

  it('se renderizan tres puntos animados visibles en la pantalla', () => {
    render(<Loading />)
    const dots = screen.getAllByTestId('loading-dot')
    expect(dots).toHaveLength(3)
  })
})
