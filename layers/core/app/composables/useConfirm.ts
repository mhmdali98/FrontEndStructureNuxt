import { LazyAppConfirmModal } from '#components'

export interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  danger?: boolean
}

/** Promise-based confirmation dialog built on `useOverlay`. */
export function useConfirm() {
  const overlay = useOverlay()
  const modal = overlay.create(LazyAppConfirmModal)

  async function confirm(options: ConfirmOptions): Promise<boolean> {
    const instance = modal.open(options)
    const result = await instance.result
    return result === true
  }

  return { confirm }
}
