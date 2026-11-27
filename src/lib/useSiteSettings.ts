"use client";

import { useEffect, useState } from "react";
import { INSTITUTE_INFO } from "./constants";
import { apiFetch } from "./api";

export interface SiteContactSettings {
  helpline: string;
  email: string;
  admissionsEmail: string;
  address: string;
  officeHours: string;
  facebook: string;
  instagram: string;
}

const DEFAULT_SETTINGS: SiteContactSettings = {
  helpline: INSTITUTE_INFO.helpline,
  email: INSTITUTE_INFO.email,
  admissionsEmail: INSTITUTE_INFO.admissionsEmail,
  address: INSTITUTE_INFO.address,
  officeHours: INSTITUTE_INFO.officeHours,
  facebook: INSTITUTE_INFO.facebook,
  instagram: INSTITUTE_INFO.instagram,
};

let cachedSettings: SiteContactSettings | null = null;

export function useSiteSettings(): SiteContactSettings {
  const [settings, setSettings] = useState<SiteContactSettings>(
    cachedSettings || DEFAULT_SETTINGS
  );

  useEffect(() => {
    let active = true;
    apiFetch(`/site-settings.php?_t=${Date.now()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d?.settings) {
          const merged: SiteContactSettings = { ...DEFAULT_SETTINGS, ...d.settings };
          cachedSettings = merged;
          setSettings(merged);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return settings;
}
