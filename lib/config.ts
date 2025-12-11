import presenceConfigJson from "../config/presenceShift.json";
import { getActiveRitualConfig, type RitualConfigJson } from "./configStore";
export type PresenceConfig = typeof presenceConfigJson;

let cachedConfig: PresenceConfig | null = null;

export function getPresenceConfig(): PresenceConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  if (process.env.NODE_ENV === "production") {
    try {
      const defaultRitualSlug =
        process.env.DEFAULT_RITUAL_SLUG || "ps1_foundation";

      void getActiveRitualConfig(defaultRitualSlug).then((active) => {
        const cfg = active.config as unknown as PresenceConfig;
        cachedConfig = cfg;
      });
    } catch {
      cachedConfig = presenceConfigJson;
      return cachedConfig;
    }
  }

  if (!cachedConfig) {
    cachedConfig = presenceConfigJson;
  }

  return cachedConfig;
}
