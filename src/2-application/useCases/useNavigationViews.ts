/**
 * Composable managing current navigation view, query filters, and sort mode selection.
 * Provides reactive view-state switching between Bookmarks, Open Tabs, Visited, and Sessions.
 */
import { ref } from 'vue'
import type { NavigationTab, SortMode } from '../../1-domain/entities/BrowserItem'

const activeView = ref<NavigationTab>('bookmarks')
const sortMode = ref<SortMode>('default')
const searchQuery = ref<string>('')

export function useNavigationViews() {
  function setView(tab: NavigationTab) {
    activeView.value = tab
    searchQuery.value = ''
  }

  function setSortMode(mode: SortMode) {
    sortMode.value = mode
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

