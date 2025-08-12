"use client";

import { create } from "zustand";

export interface AudioQueueItem {
  id: string;
  title: string;
  text: string;
}

interface AudioQueueState {
  queue: AudioQueueItem[];
  currentIndex: number;
  isPlaying: boolean;
  setQueue: (items: AudioQueueItem[]) => void;
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
}

export const useAudioQueue = create<AudioQueueState>((set, get) => ({
  queue: [],
  currentIndex: 0,
  isPlaying: false,
  setQueue: (items) => set({ queue: items, currentIndex: 0 }),
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  next: () => {
    const { currentIndex, queue } = get();
    if (currentIndex < queue.length - 1)
      set({ currentIndex: currentIndex + 1 });
  },
  prev: () => {
    const { currentIndex } = get();
    if (currentIndex > 0) set({ currentIndex: currentIndex - 1 });
  },
}));
