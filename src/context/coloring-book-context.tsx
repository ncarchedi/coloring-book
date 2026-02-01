"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface ColoringPage {
  image: string;
  selected: boolean;
}

interface ColoringBookState {
  title: string;
  pages: ColoringPage[];
  age: number;
}

interface ColoringBookContextValue extends ColoringBookState {
  setTitle: (title: string) => void;
  setAge: (age: number) => void;
  addPage: (image: string) => void;
  removePage: (index: number) => void;
  togglePageSelection: (index: number) => void;
  reorderPages: (fromIndex: number, toIndex: number) => void;
  reset: () => void;
}

const defaultState: ColoringBookState = {
  title: "",
  pages: [],
  age: 3,
};

const ColoringBookContext = createContext<ColoringBookContextValue | null>(null);

export function ColoringBookProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ColoringBookState>(defaultState);

  const setTitle = useCallback((title: string) => {
    setState((prev) => ({ ...prev, title }));
  }, []);

  const setAge = useCallback((age: number) => {
    setState((prev) => ({ ...prev, age }));
  }, []);

  const addPage = useCallback((image: string) => {
    setState((prev) => ({
      ...prev,
      pages: [...prev.pages, { image, selected: true }],
    }));
  }, []);

  const removePage = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      pages: prev.pages.filter((_, i) => i !== index),
    }));
  }, []);

  const togglePageSelection = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      pages: prev.pages.map((p, i) =>
        i === index ? { ...p, selected: !p.selected } : p
      ),
    }));
  }, []);

  const reorderPages = useCallback((fromIndex: number, toIndex: number) => {
    setState((prev) => {
      const newPages = [...prev.pages];
      const [moved] = newPages.splice(fromIndex, 1);
      newPages.splice(toIndex, 0, moved);
      return { ...prev, pages: newPages };
    });
  }, []);

  const reset = useCallback(() => {
    setState(defaultState);
  }, []);

  return (
    <ColoringBookContext.Provider
      value={{
        ...state,
        setTitle,
        setAge,
        addPage,
        removePage,
        togglePageSelection,
        reorderPages,
        reset,
      }}
    >
      {children}
    </ColoringBookContext.Provider>
  );
}

export function useColoringBook() {
  const ctx = useContext(ColoringBookContext);
  if (!ctx) {
    throw new Error("useColoringBook must be used within a ColoringBookProvider");
  }
  return ctx;
}
