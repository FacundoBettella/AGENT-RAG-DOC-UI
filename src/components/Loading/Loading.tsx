const DOT_CLASSES = 'inline-block mx-[0.1rem] h-2 w-2 animate-bounce rounded-full bg-primary'
const DOT_DELAY_CLASSES = [
  '[animation-delay:0s]',
  '[animation-delay:0.2s]',
  '[animation-delay:0.4s]',
] as const

const Loading = () => {
  return (
    <div role="status" aria-label="Cargando" className="inline-flex items-center gap-1">
      {DOT_DELAY_CLASSES.map((delay) => (
        <span key={delay} data-testid="loading-dot" className={`${DOT_CLASSES} ${delay}`} />
      ))}
    </div>
  )
}

export default Loading
