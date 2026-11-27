"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

export interface AdminCenterItem {
  id: string;
  centerCode: string;
  centerName: string;
  city: string;
  state: string;
  status: string;
}

interface AdminCenterContextValue {
  centers: AdminCenterItem[];
  selectedCenterId: string;
  setSelectedCenterId: (id: string) => void;
  selectedCenter: AdminCenterItem | null;
  refreshCenters: () => void;
}

const AdminCenterContext = createContext<AdminCenterContextValue>({
  centers: [],
  selectedCenterId: "ALL",
  setSelectedCenterId: () => {},
  selectedCenter: null,
  refreshCenters: () => {},
});

const STORAGE_KEY = "esi_admin_selected_center";

export function AdminCenterProvider({ children }: { children: React.ReactNode }) {
  const [centers, setCenters] = useState<AdminCenterItem[]>([]);
  const [selectedCenterId, setSelectedCenterIdState] = useState<string>("ALL");

  const loadCenters = () => {
    apiFetch("/franchises.php")
      .then((r) => (r.ok ? r.json() : { franchises: [] }))
      .then((d) => {
        if (Array.isArray(d?.franchises)) {
          setCenters(d.franchises);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) setSelectedCenterIdState(saved);
    } catch {
      // ignore
    }
    loadCenters();
  }, []);

  const setSelectedCenterId = (id: string) => {
    setSelectedCenterIdState(id);
    try {
      sessionStorage.setItem(STORAGE_KEY, id);
    } catch {
      // ignore
    }
  };

  const selectedCenter = useMemo(
    () => centers.find((c) => c.id === selectedCenterId) || null,
    [centers, selectedCenterId]
  );

  return (
    <AdminCenterContext.Provider
      value={{
        centers,
        selectedCenterId,
        setSelectedCenterId,
        selectedCenter,
        refreshCenters: loadCenters,
      }}
    >
      {children}
    </AdminCenterContext.Provider>
  );
}

export function useAdminCenter() {
  return useContext(AdminCenterContext);
}
