import { PrismaClient, Prisma } from "@prisma/client";

// Type-safe fallbacks for Prisma models (works before and after prisma generate)
type Ritual = any;
type RitualConfigVersion = any;

/**
 * Singleton Prisma client
 *
 * In a Next.js app, you typically want a single PrismaClient instance
 * reused across hot reloads in development. This approach avoids
 * creating too many connections.
 */
const globalForPrisma = globalThis as any;

export const prisma =
  (globalForPrisma.prisma as PrismaClient | undefined) ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export interface StepConfig {
  description: string;
  script: string;
  miniPrompts?: string[];
  presenceNotes?: string[];
}

export type PresenceStepsConfig = Record<
  "ANSWER" | "INTEND" | "FOCUS" | "FLOW" | "BEGIN",
  StepConfig
>;

export interface RitualConfigJson {
  brandVoice: {
    tone: string;
    guidelines?: {
      do?: string[];
      dont?: string[];
    };
  };
  safety: {
    disclaimer: string;
    crisisTemplate: string;
    keywords?: string[];
  };
  steps: PresenceStepsConfig & Record<string, StepConfig>;
}

/**
 * Returned shape when fetching the active configuration for a ritual.
 */
export interface ActiveRitualConfig {
  ritual: Ritual;
  version: RitualConfigVersion;
  config: RitualConfigJson;
}

/**
 * Ensure that a ritual exists with the given slug, creating it if
 * necessary. Returns the Ritual row.
 */
export async function ensureRitual(opts: {
  slug: string;
  name: string;
  description?: string | null;
}): Promise<Ritual> {
  const { slug, name, description } = opts;

  const ritual = await prisma.ritual.upsert({
    where: { slug },
    create: {
      slug,
      name,
      description: description ?? null,
    },
    update: {
      name,
      description: description ?? null,
    },
  });

  return ritual;
}

/**
 * Fetch the active ritual configuration for a given ritual slug.
 *
 * Throws if no active version is found.
 */
export async function getActiveRitualConfig(
  ritualSlug: string,
): Promise<ActiveRitualConfig> {
  const ritual = await prisma.ritual.findUnique({
    where: { slug: ritualSlug },
  });

  if (!ritual) {
    throw new Error(`Ritual with slug "${ritualSlug}" not found.`);
  }

  const version = await prisma.ritualConfigVersion.findFirst({
    where: {
      ritualId: ritual.id,
      isActive: true,
    },
    orderBy: {
      versionNumber: "desc",
    },
  });

  if (!version) {
    throw new Error(
      `No active config version found for ritual with slug "${ritualSlug}".`,
    );
  }

  const config = version.configJson as unknown as RitualConfigJson;

  return { ritual, version, config };
}

/**
 * Fetch all versions for a given ritual slug, ordered by versionNumber
 * descending (newest first).
 */
export async function getRitualVersions(
  ritualSlug: string,
): Promise<RitualConfigVersion[]> {
  const ritual = await prisma.ritual.findUnique({
    where: { slug: ritualSlug },
  });

  if (!ritual) {
    return [];
  }

  const versions = await prisma.ritualConfigVersion.findMany({
    where: { ritualId: ritual.id },
    orderBy: { versionNumber: "desc" },
  });

  return versions;
}

/**
 * Create a new config version for a ritual.
 *
 * - If the ritual does not exist yet, it is first created.
 * - The new version will have versionNumber = previous max + 1.
 * - By default, the new version becomes the active one, and all
 *   other versions for that ritual are marked inactive.
 */
export async function createRitualConfigVersion(opts: {
  ritualSlug: string;
  ritualName: string;
  ritualDescription?: string | null;
  config: RitualConfigJson;
  label?: string | null;
  notes?: string | null;
  createdBy?: string | null;
  makeActive?: boolean;
}): Promise<RitualConfigVersion> {
  const {
    ritualSlug,
    ritualName,
    ritualDescription,
    config,
    label,
    notes,
    createdBy,
    makeActive = true,
  } = opts;

  const ritual = await ensureRitual({
    slug: ritualSlug,
    name: ritualName,
    description: ritualDescription ?? null,
  });

  const maxVersion = await prisma.ritualConfigVersion.aggregate({
    where: { ritualId: ritual.id },
    _max: {
      versionNumber: true,
    },
  });

  const nextVersionNumber = (maxVersion._max.versionNumber ?? 0) + 1;

  // If this version should become active, mark all others inactive first.
  if (makeActive) {
    await prisma.ritualConfigVersion.updateMany({
      where: { ritualId: ritual.id, isActive: true },
      data: { isActive: false },
    });
  }

  const version = await prisma.ritualConfigVersion.create({
    data: {
      ritualId: ritual.id,
      versionNumber: nextVersionNumber,
      isActive: makeActive,
      label: label ?? null,
      notes: notes ?? null,
      configJson: config,
      createdBy: createdBy ?? null,
    },
  });

  return version;
}

/**
 * Mark a specific version (by ID) as the active version for its ritual.
 * All other versions for that ritual are marked inactive.
 */
export async function activateRitualConfigVersion(
  versionId: string,
): Promise<RitualConfigVersion> {
  const version = await prisma.ritualConfigVersion.findUnique({
    where: { id: versionId },
  });

  if (!version) {
    throw new Error(`RitualConfigVersion with id "${versionId}" not found.`);
  }

  // Mark all other versions for this ritual as inactive
  await prisma.ritualConfigVersion.updateMany({
    where: {
      ritualId: version.ritualId,
      id: {
        not: version.id,
      },
    },
    data: { isActive: false },
  });

  // Mark this version as active
  const updated = await prisma.ritualConfigVersion.update({
    where: { id: version.id },
    data: { isActive: true },
  });

  return updated;
}

/**
 * Convenience helper to duplicate an existing version as a new version,
 * optionally making the new one active.
 *
 * Useful when you want to "branch" from a previous version but keep a
 * clear linear version history.
 */
export async function duplicateRitualConfigVersion(opts: {
  sourceVersionId: string;
  label?: string | null;
  notes?: string | null;
  createdBy?: string | null;
  makeActive?: boolean;
}): Promise<RitualConfigVersion> {
  const { sourceVersionId, label, notes, createdBy, makeActive = true } = opts;

  const source = await prisma.ritualConfigVersion.findUnique({
    where: { id: sourceVersionId },
  });

  if (!source) {
    throw new Error(
      `Cannot duplicate config: source version "${sourceVersionId}" not found.`,
    );
  }

  const ritual = await prisma.ritual.findUnique({
    where: { id: source.ritualId },
  });

  if (!ritual) {
    throw new Error(
      `Inconsistent data: ritual "${source.ritualId}" not found for version "${source.id}".`,
    );
  }

  const next = await createRitualConfigVersion({
    ritualSlug: ritual.slug,
    ritualName: ritual.name,
    ritualDescription: ritual.description ?? undefined,
    config: source.configJson as unknown as RitualConfigJson,
    label: label ?? `Copy of v${source.versionNumber}`,
    notes: notes ?? null,
    createdBy: createdBy ?? null,
    makeActive,
  });

  return next;
}
