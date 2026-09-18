import { create } from 'zustand';
import { MapFilterType } from '../types';

interface FilterState {
  activeFilter: MapFilterType;
  searchQuery: string;
  selectedOfficerId: string | null;
  isDrawerExpanded: boolean;

  setFilter: (filter: MapFilterType) => void;
  setSearchQuery: (query: string) => void;
  setSelectedOfficerId: (id: string | null) => void;
  toggleDrawer: () => void;
  setDrawerExpanded: (expanded: boolean) => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  activeFilter: 'all',
  searchQuery: '',
  selectedOfficerId: 'off-01',
  isDrawerExpanded: false,

  setFilter: (filter) => set({ activeFilter: filter }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedOfficerId: (id) => set({ selectedOfficerId: id }),
  toggleDrawer: () => set((state) => ({ isDrawerExpanded: !state.isDrawerExpanded })),
  setDrawerExpanded: (expanded) => set({ isDrawerExpanded: expanded }),
}));
