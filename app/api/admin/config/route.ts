import { NextRequest, NextResponse } from "next/server";

import { getPresenceConfig } from "@/lib/config";

import {
  createRitualConfigVersion,
  getRitualVersions,
  activateRitualConfigVersion,
  type RitualConfigJson,
} from "@/lib/configStore";

const ADMIN_SECRET = process.env.ADMIN_SECRET;

/**
 * GET /api/admin/config
 *
 * Returns the current Presence Shift configuration JSON as text.
 * Requires an `x-admin-secret` header matching ADMIN_SECRET.
 *
 * NOTE:

  * - This endpoint assumes that the active configuration is available

  *   through `getPresenceConfig()`. In addition, when a database-backed
  *   ritual configuration is present, it will return that config and the
  *   list of versions for the default ritual.
  */
export async function GET(req: NextRequest) {
  if (!ADMIN_SECRET) {
    return NextResponse.json(
      { error: "ADMIN_SECRET is not configured on the server." },
      { status: 500 },
    );
  }

  const secretHeader = req.headers.get("x-admin-secret");

  if (!secretHeader || secretHeader !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Default ritual slug; this can be made dynamic later if you support
  // multiple rituals from the admin UI.
  const defaultRitualSlug = process.env.DEFAULT_RITUAL_SLUG || "ps1_foundation";

  let config = getPresenceConfig();

  let versions = [] as Awaited<ReturnType<typeof getRitualVersions>>;

  try {
    versions = await getRitualVersions(defaultRitualSlug);
    // If there is at least one version, prefer the most recent configJson
    if (versions.length > 0) {
      const latest = versions[0];
      config = latest.configJson as unknown as typeof config;
    }
  } catch {
    // If DB lookup fails, silently fall back to the static JSON config.
    versions = [];
  }

  const payload = {
    ritualSlug: defaultRitualSlug,
    config,
    versions: versions.map((v) => ({
      id: v.id,
      versionNumber: v.versionNumber,
      isActive: v.isActive,
      label: v.label,
      notes: v.notes,
      createdBy: v.createdBy,
      createdAt: v.createdAt,
    })),
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,

    headers: { "Content-Type": "application/json" },
  });
}

/**
 * POST /api/admin/config
 *
 * Accepts a JSON body representing a new Presence Shift configuration.
 * Requires an `x-admin-secret` header matching ADMIN_SECRET.
 *

  * IMPORTANT:

  * - This implementation validates and then stores the configuration
  *   as a new versioned record in the database for the default ritual.
  * - It also marks the new version as active (and deactivates prior
  *   versions) so the Companion uses it for new sessions.
  */
export async function POST(req: NextRequest) {
  if (!ADMIN_SECRET) {
    return NextResponse.json(
      { error: "ADMIN_SECRET is not configured on the server." },
      { status: 500 },
    );
  }

  const secretHeader = req.headers.get("x-admin-secret");
  if (!secretHeader || secretHeader !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let newConfig: unknown;

  try {
    newConfig = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body." },
      { status: 400 },
    );
  }

  // Basic validation: ensure it has at least the top-level keys we expect.
  if (
    typeof newConfig !== "object" ||
    newConfig === null ||
    !("steps" in newConfig) ||
    !("brandVoice" in newConfig) ||
    !("safety" in newConfig)
  ) {
    return NextResponse.json(
      {
        error:
          "Config is missing required top-level keys (steps, brandVoice, safety).",
      },
      { status: 400 },
    );
  }

  // At this point, persist `newConfig` as a new ritual config version.
  // We assume the payload matches the RitualConfigJson shape.
  const defaultRitualSlug = process.env.DEFAULT_RITUAL_SLUG || "ps1_foundation";
  const ritualName =
    process.env.DEFAULT_RITUAL_NAME || "Presence Shift 1 – Foundation";

  let createdVersionId: string | null = null;

  try {
    const cfg = newConfig as RitualConfigJson;

    const version = await createRitualConfigVersion({
      ritualSlug: defaultRitualSlug,
      ritualName,
      ritualDescription: null,
      config: cfg,
      label: "Admin edit",
      notes: null,
      createdBy: "admin",
      makeActive: true,
    });

    createdVersionId = version.id;
  } catch (err) {
    console.error("Error creating ritual config version from admin POST:", err);
    return NextResponse.json(
      {
        error: "Failed to save config version. See server logs for details.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      message: "Config saved as a new active ritual version.",
      versionId: createdVersionId,
    },
    { status: 200 },
  );
}
