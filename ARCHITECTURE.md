# Tabloom Architecture & Data Flow

Tabloom adheres to a strict 4-Layer Clean Architecture with unidirectional dependencies, zero cyclic coupling, and complete framework isolation in the domain layer.

## 4-Layer System Overview

```
 +-------------------------------------------------------------------------+
 |                            1. DOMAIN LAYER                             |
 |  Pure TypeScript Entities, Zod v4 Schemas, Port Interfaces (0 Framework) |
 |  - Tile.ts, AppSettings.ts, BrowserItem.ts                              |
 |  - IStoragePort.ts, IBrowserPort.ts                                     |
 +------------------------------------+------------------------------------+
                                      ^
                                      | implements / validates
 +------------------------------------+------------------------------------+
 |                        3. INFRASTRUCTURE LAYER                          |
 |  Real Browser Adapters, Localhost Fallbacks, Native Favicon Resolution   |
 |  - StorageAdapter (chrome.storage.local -> localStorage)                |
 |  - BrowserHistoryAndApiAdapter (chrome.* APIs -> Local Fallbacks)        |
 |  - FaviconService (Native chrome-extension://_favicon/ -> Google S2)    |
 +------------------------------------+------------------------------------+
                                      ^
                                      | dependency injection
 +------------------------------------+------------------------------------+
 |                         2. APPLICATION LAYER                            |
 |  Pure Domain Services, Composable Stores, Telemetry & View Logic         |
 |  - tileEngine.ts (Deduplication, fuzzy search, sorting)                 |
 |  - tileLoaderService.ts (View query orchestration)                      |
 |  - useTilesStore.ts (Reactive tile state, reorder, overrides)            |
 |  - useSettingsStore.ts (Reactive settings, CSS injection, JSON sync)     |
 |  - useNavigationViews.ts (Tabs: Bookmarks, Tabs, Visited, Session)       |
 +------------------------------------+------------------------------------+
                                      ^
                                      | reactive state & events
 +------------------------------------+------------------------------------+
 |                        4. PRESENTATION LAYER                            |
 |  Decomposed Vue 3.5 Components, Glassmorphism, Ambient Canvas           |
 |  - App.vue (Master coordinator)                                         |
 |  - TopNavHeader.vue, WebSearchBar.vue, SortModeBar.vue                  |
 |  - TileGridContainer.vue, TileItemCard.vue, AddNewTileCard.vue           |
 |  - TileEditorModal.vue, CustomizeDrawer.vue                             |
 |  - CosmicCanvas.vue (0% idle CPU with visibilitychange sleep)           |
 +-------------------------------------------------------------------------+
```

## Runtime Data Flow

1. **Initialization**:
   - `App.vue` mounts -> triggers `useSettingsStore.init()` and `useTilesStore.init()`.
   - `StorageAdapter` loads user preferences and custom overrides from `chrome.storage.local` (or `localStorage`).
   - `useSettingsStore` dynamically applies CSS custom properties (`--bg-start`, `--tile-bg`, `--accent`, etc.) to `document.documentElement`.

2. **Dynamic Live Browser Synchronization**:
   - Depending on the active tab (`Bookmarks`, `Open tabs`, `Most visited`, `Last session`), `tileLoaderService` queries the real Chrome APIs via `BrowserHistoryAndApiAdapter`.
   - In localhost standalone mode, the app provides a customizable state with full support for adding shortcuts or importing bookmarks `.html` / history `.json`.

3. **Event-Driven Interactions**:
   - Clicking a tile records usage telemetry, increments `useCount`, and opens the URL (or focuses/restores the target tab/window).
   - Drag-and-drop reorders tiles and saves the custom sort indices into local storage.
   - Deleting a discovered tile adds its domain/URL to `hiddenUrls` so it never reappears in auto-discovery.

4. **Resource Efficiency**:
   - Zero background service workers or idle polling loops.
   - `CosmicCanvas` listens to `document.visibilitychange` and cancels animation frames immediately when the tab is blurred or hidden.

