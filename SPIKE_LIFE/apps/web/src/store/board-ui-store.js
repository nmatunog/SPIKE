import { create } from 'zustand'

export const useBoardUIStore = create((set) => ({
  expandedCard: null,
  expandedPanel: null,
  showEncounterModal: false,
  highlightSpaceIndex: null,

  setExpandedCard: (expandedCard) =>
    set((state) => ({
      expandedCard,
      expandedPanel: expandedCard ? null : state.expandedPanel,
    })),
  setExpandedPanel: (expandedPanel) =>
    set((state) => ({
      expandedPanel,
      expandedCard: expandedPanel ? null : state.expandedCard,
    })),
  setShowEncounterModal: (showEncounterModal) => set({ showEncounterModal }),
  setHighlightSpaceIndex: (highlightSpaceIndex) => set({ highlightSpaceIndex }),
  resetPanels: () =>
    set({ expandedCard: null, expandedPanel: null, showEncounterModal: false, highlightSpaceIndex: null }),
}))
