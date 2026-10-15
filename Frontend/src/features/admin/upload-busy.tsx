"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type AdminUploadBusyContextValue = {
  pendingCount: number;
  isBusy: boolean;
  registerPending: () => void;
  clearPending: () => void;
};

const AdminUploadBusyContext = createContext<AdminUploadBusyContextValue | null>(null);

const NOOP_BUSY: AdminUploadBusyContextValue = {
  pendingCount: 0,
  isBusy: false,
  registerPending: () => undefined,
  clearPending: () => undefined,
};

export function AdminUploadBusyProvider({ children }: { children: ReactNode }) {
  const [pendingCount, setPendingCount] = useState(0);

  const registerPending = useCallback(() => {
    setPendingCount((count) => count + 1);
  }, []);

  const clearPending = useCallback(() => {
    setPendingCount((count) => Math.max(0, count - 1));
  }, []);

  const value = useMemo(
    () => ({
      pendingCount,
      isBusy: pendingCount > 0,
      registerPending,
      clearPending,
    }),
    [pendingCount, registerPending, clearPending],
  );

  return <AdminUploadBusyContext.Provider value={value}>{children}</AdminUploadBusyContext.Provider>;
}

export function useAdminUploadBusy(): AdminUploadBusyContextValue {
  return useContext(AdminUploadBusyContext) ?? NOOP_BUSY;
}
