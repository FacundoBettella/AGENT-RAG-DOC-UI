import { useCallback, useEffect, useMemo, useState } from 'react'
import { promptsService } from '../services/promptsService'
import { analyticsService } from '../services/analyticsService'

export type PromptsLoadStatus = 'loading' | 'ready' | 'error'
export type PromptSaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export interface PromptEditor {
  agentName: string
  savedPrompt: string
  draft: string
  isDirty: boolean
  canSave: boolean
  status: PromptSaveStatus
  error: string | null
}

export interface UsePromptsConfigReturn {
  loadStatus: PromptsLoadStatus
  loadError: string | null
  editors: PromptEditor[]
  confirmingAgent: string | null
  changeDraft: (agentName: string, value: string) => void
  discardDraft: (agentName: string) => void
  requestSave: (agentName: string) => void
  confirmSave: () => void
  cancelSave: () => void
  reload: () => void
}

interface EditorState {
  savedPrompt: string
  draft: string
  status: PromptSaveStatus
  error: string | null
}

const LOAD_ERROR_FALLBACK = 'No se pudieron cargar los prompts. Intentá de nuevo.'
const SAVE_ERROR_FALLBACK = 'No se pudo guardar el prompt. Intentá de nuevo.'

function canSaveState(state: EditorState): boolean {
  return state.draft !== state.savedPrompt && state.draft.trim() !== '' && state.status !== 'saving'
}

function buildEditor(agentName: string, state: EditorState): PromptEditor {
  return {
    agentName,
    savedPrompt: state.savedPrompt,
    draft: state.draft,
    isDirty: state.draft !== state.savedPrompt,
    canSave: canSaveState(state),
    status: state.status,
    error: state.error,
  }
}

export function usePromptsConfig(): UsePromptsConfigReturn {
  const [loadStatus, setLoadStatus] = useState<PromptsLoadStatus>('loading')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [agentOrder, setAgentOrder] = useState<string[]>([])
  const [editorStates, setEditorStates] = useState<Record<string, EditorState>>({})
  const [confirmingAgent, setConfirmingAgent] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoadStatus('loading')
    setLoadError(null)
    try {
      const prompts = await promptsService.list()
      const nextStates: Record<string, EditorState> = {}
      for (const prompt of prompts) {
        nextStates[prompt.agentName] = {
          savedPrompt: prompt.systemPrompt,
          draft: prompt.systemPrompt,
          status: 'idle',
          error: null,
        }
      }
      setAgentOrder(prompts.map((prompt) => prompt.agentName))
      setEditorStates(nextStates)
      setLoadStatus('ready')
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : LOAD_ERROR_FALLBACK)
      setLoadStatus('error')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const changeDraft = useCallback((agentName: string, value: string) => {
    setEditorStates((prev) => {
      const current = prev[agentName]
      if (!current) return prev
      const nextStatus = current.status === 'saved' ? 'idle' : current.status
      return { ...prev, [agentName]: { ...current, draft: value, status: nextStatus } }
    })
  }, [])

  const discardDraft = useCallback((agentName: string) => {
    setEditorStates((prev) => {
      const current = prev[agentName]
      if (!current) return prev
      return { ...prev, [agentName]: { ...current, draft: current.savedPrompt } }
    })
  }, [])

  const requestSave = useCallback(
    (agentName: string) => {
      const current = editorStates[agentName]
      if (!current || !canSaveState(current)) return
      setConfirmingAgent(agentName)
    },
    [editorStates]
  )

  const confirmSave = useCallback(() => {
    const agentName = confirmingAgent
    if (agentName === null) return
    const current = editorStates[agentName]
    if (!current || !canSaveState(current)) {
      setConfirmingAgent(null)
      return
    }

    const draftToSave = current.draft
    setConfirmingAgent(null)
    analyticsService.trackEvent('prompt_saved', {
      agentName,
      promptLength: draftToSave.length,
    })

    setEditorStates((prev) => {
      const entry = prev[agentName]
      if (!entry) return prev
      return { ...prev, [agentName]: { ...entry, status: 'saving' } }
    })

    void promptsService.update(agentName, draftToSave).then(
      (result) => {
        setEditorStates((prev) => {
          const entry = prev[agentName]
          if (!entry) return prev
          return {
            ...prev,
            [agentName]: {
              savedPrompt: result.systemPrompt,
              draft: result.systemPrompt,
              status: 'saved',
              error: null,
            },
          }
        })
      },
      (err: unknown) => {
        setEditorStates((prev) => {
          const entry = prev[agentName]
          if (!entry) return prev
          return {
            ...prev,
            [agentName]: {
              ...entry,
              status: 'error',
              error: err instanceof Error ? err.message : SAVE_ERROR_FALLBACK,
            },
          }
        })
      }
    )
  }, [confirmingAgent, editorStates])

  const cancelSave = useCallback(() => {
    setConfirmingAgent(null)
  }, [])

  const reload = useCallback(() => {
    void load()
  }, [load])

  const editors = useMemo(
    () =>
      agentOrder.flatMap((agentName) => {
        const state = editorStates[agentName]
        return state ? [buildEditor(agentName, state)] : []
      }),
    [agentOrder, editorStates]
  )

  return {
    loadStatus,
    loadError,
    editors,
    confirmingAgent,
    changeDraft,
    discardDraft,
    requestSave,
    confirmSave,
    cancelSave,
    reload,
  }
}
