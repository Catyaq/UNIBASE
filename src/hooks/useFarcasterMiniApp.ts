"use client";

import { useContext } from "react";

import {
  FarcasterMiniAppContext,
  type FarcasterMiniAppContextValue,
} from "@/context/FarcasterMiniAppContext";

const defaultValue: FarcasterMiniAppContextValue = {
  context: null,
  inMiniApp: false,
  isSdkReady: false,
  isLoading: true,
  error: null,
  user: null,
  refreshContext: async () => {},
};

export function useFarcasterMiniApp(): FarcasterMiniAppContextValue {
  const ctx = useContext(FarcasterMiniAppContext);
  return ctx ?? defaultValue;
}
