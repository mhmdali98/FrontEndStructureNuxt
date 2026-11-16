/** Shared shell UI state (command palette, customizer, shortcuts dialog). */
export function useShell() {
  const searchOpen = useState('shell-search-open', () => false)
  const customizerOpen = useState('shell-customizer-open', () => false)
  const shortcutsOpen = useState('shell-shortcuts-open', () => false)
  return { searchOpen, customizerOpen, shortcutsOpen }
}

export interface ShortcutEntry {
  keys: string
  label: string
  to: string
}

/** Registry-driven `g-x` shortcuts. Core hard-codes no feature route. */
export function useRegistryShortcuts() {
  const { flat } = useNavigation()
  const shortcuts = computed<ShortcutEntry[]>(() => flat.value
    .filter(i => i.shortcut && i.to)
    .map(i => ({ keys: i.shortcut!, label: i.label, to: i.to! })))
  return { shortcuts }
}
