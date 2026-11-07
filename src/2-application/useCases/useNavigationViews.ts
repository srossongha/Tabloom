/**
 * Composable managing current navigation view, query filters, and sort mode selection.
 * Provides reactive view-state switching between Bookmarks, Open Tabs, Visited, and Sessions,
 * with persistence to ensure user navigation preferences are remembered across reloads.
 */
import { ref } from 'vue'
import type { NavigationTab, SortMode } from '../../1-domain/entities/BrowserItem'

function getSavedView(): NavigationTab {
  try {
    const v = localStorage.getItem('tabloom_active_view') as NavigationTab
    if (v && ['bookmarks', 'frequent', 'recent', 'openTabs'].includes(v)) return v
  } catch {}
  return 'bookmarks'
}

function getSavedSort(): SortMode {
  try {
    const s = localStorage.getItem('tabloom_sort_mode') as SortMode
    if (s && ['default', 'name', 'mostUsed'].includes(s)) return s
  } catch {}
  return 'default'
}

const activeView = ref<NavigationTab>(getSavedView())
const sortMode = ref<SortMode>(getSavedSort())
const searchQuery = ref<string>('')

export function useNavigationViews() {
  function setView(tab: NavigationTab) {
    activeView.value = tab
    searchQuery.value = ''
    try {
      localStorage.setItem('tabloom_active_view', tab)
    } catch {}
  }

  function setSortMode(mode: SortMode) {
    sortMode.value = mode
    try {
      localStorage.setItem('tabloom_sort_mode', mode)
    } catch {}
  }

  function setSearchQuery(query: string) {
    searchQuery.value = query
  }

  function clearSearch() {
    searchQuery.value = ''
  }

  return {
    activeView,
    sortMode,
    searchQuery,
    setView,
    setSortMode,
    setSearchQuery,
    clearSearch,
  }
}
