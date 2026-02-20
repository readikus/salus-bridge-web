import { MilestoneConfigRepository } from "@/providers/repositories/milestone-config.repository";
import { MilestoneGuidanceRepository } from "@/providers/repositories/milestone-guidance.repository";
import { SicknessCaseRepository } from "@/providers/repositories/sickness-case.repository";
import {
  MilestoneConfig,
  MilestoneGuidanceRecord,
  MilestoneGuidanceContent,
  MilestoneConfigWithGuidance,
} from "@/types/database";
import { CreateMilestoneConfigInput, MilestoneGuidanceInput } from "@/schemas/milestone-config";
import { DEFAULT_MILESTONES } from "@/constants/milestone-defaults";
import { MILESTONE_GUIDANCE } from "@/constants/milestone-guidance";
import { PoolClient } from "pg";

/**
 * Timeline entry for a specific sickness case milestone.
 */
export interface CaseTimelineEntry {
  milestone: MilestoneConfig;
  dueDate: string; // ISO date string (YYYY-MM-DD)
  status: "OVERDUE" | "DUE_TODAY" | "UPCOMING";
  daysSinceStart: number;
}

/**
 * MilestoneService -- business logic for milestone config and timeline computation.
 */
export class MilestoneService {
  /**
   * Get effective milestones for an organisation.
   * Merges system defaults with org overrides.
   * If org has an override for a milestone_key, use the override.
   * If org has no override, use the default.
   * Returns sorted by dayOffset ascending, filtered to active only.
   */
  static async getEffectiveMilestones(organisationId: string, client?: PoolClient): Promise<MilestoneConfig[]> {
    // Fetch DB defaults and org overrides
    const [defaults, overrides] = await Promise.all([
      MilestoneConfigRepository.findDefaults(client),
      MilestoneConfigRepository.findByOrganisation(organisationId, client),
    ]);

    // Build a map keyed by milestone_key, starting with defaults
    const milestoneMap = new Map<string, MilestoneConfig>();

    // If DB has seeded defaults, use them
    if (defaults.length > 0) {
      for (const d of defaults) {
        milestoneMap.set(d.milestoneKey, d);
      }
    } else {
      // Fallback to hardcoded defaults if DB not seeded yet
      for (const d of DEFAULT_MILESTONES) {
        milestoneMap.set(d.key, {
          id: `default-${d.key}`,
          organisationId: null,
          milestoneKey: d.key,
          label: d.label,
          dayOffset: d.dayOffset,
          description: d.description,
          isActive: true,
          isDefault: true,
          createdBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    // Override with org-specific configs
    for (const o of overrides) {
      milestoneMap.set(o.milestoneKey, o);
    }

    // Filter active and sort by dayOffset
    return Array.from(milestoneMap.values())
      .filter((m) => m.isActive)
      .sort((a, b) => a.dayOffset - b.dayOffset);
  }

  /**
   * Get effective milestones with guidance content for the editor UI.
   * Returns all milestones (active and inactive) with guidance attached.
   */
  static async getEffectiveMilestonesWithGuidance(
    organisationId: string,
    client?: PoolClient,
  ): Promise<MilestoneConfigWithGuidance[]> {
    const [defaults, overrides] = await Promise.all([
      MilestoneConfigRepository.findDefaults(client),
      MilestoneConfigRepository.findByOrganisation(organisationId, client),
    ]);

    // Build milestone map (same as getEffectiveMilestones but without active filter)
    const milestoneMap = new Map<string, MilestoneConfig>();

    if (defaults.length > 0) {
      for (const d of defaults) {
        milestoneMap.set(d.milestoneKey, d);
      }
    } else {
      for (const d of DEFAULT_MILESTONES) {
        milestoneMap.set(d.key, {
          id: `default-${d.key}`,
          organisationId: null,
          milestoneKey: d.key,
          label: d.label,
          dayOffset: d.dayOffset,
          description: d.description,
          isActive: true,
          isDefault: true,
          createdBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    for (const o of overrides) {
      milestoneMap.set(o.milestoneKey, o);
    }

    const milestones = Array.from(milestoneMap.values()).sort((a, b) => a.dayOffset - b.dayOffset);
    const milestoneKeys = milestones.map((m) => m.milestoneKey);

    // Build guidance map
    const guidanceMap = await MilestoneService.getGuidanceMap(milestoneKeys, organisationId, client);

    // Check which keys have org-level guidance overrides
    const orgGuidanceOverrides = await MilestoneGuidanceRepository.findByOrganisation(organisationId, client);
    const orgGuidanceKeys = new Set(orgGuidanceOverrides.map((g) => g.milestoneKey));

    return milestones.map((m) => ({
      ...m,
      guidance: guidanceMap[m.milestoneKey] || null,
      guidanceIsDefault: !orgGuidanceKeys.has(m.milestoneKey),
    }));
  }

  /**
   * Create or update org-level guidance override for a milestone key.
   */
  static async upsertOrgGuidance(
    organisationId: string,
    milestoneKey: string,
    data: MilestoneGuidanceInput,
    client?: PoolClient,
  ): Promise<MilestoneGuidanceRecord> {
    const existing = await MilestoneGuidanceRepository.findByOrgAndKey(organisationId, milestoneKey, client);

    if (existing) {
      return MilestoneGuidanceRepository.update(existing.id, data, client);
    }

    return MilestoneGuidanceRepository.create(
      {
        organisationId,
        milestoneKey,
        actionTitle: data.actionTitle,
        managerGuidance: data.managerGuidance,
        suggestedText: data.suggestedText,
        instructions: data.instructions,
        employeeView: data.employeeView,
      },
      client,
    );
  }

  /**
   * Get the timeline for a specific sickness case.
   * Computes the status of each milestone based on:
   * - absenceStartDate + dayOffset = milestone due date
   * - If due date is in the past: status = "PASSED"
   * - If due date is today: status = "DUE_TODAY"
   * - If due date is in the future: status = "UPCOMING"
   */
  static async getCaseTimeline(
    sicknessCaseId: string,
    organisationId: string,
    client?: PoolClient,
  ): Promise<CaseTimelineEntry[]> {
    const sicknessCase = await SicknessCaseRepository.findById(sicknessCaseId, client);
    if (!sicknessCase) {
      throw new Error("Sickness case not found");
    }

    const milestones = await MilestoneService.getEffectiveMilestones(organisationId, client);
    const absenceStart = new Date(sicknessCase.absenceStartDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return milestones.map((milestone) => {
      const dueDate = new Date(absenceStart);
      dueDate.setDate(dueDate.getDate() + milestone.dayOffset);
      dueDate.setHours(0, 0, 0, 0);

      let status: CaseTimelineEntry["status"];
      if (dueDate.getTime() < today.getTime()) {
        status = "OVERDUE";
      } else if (dueDate.getTime() === today.getTime()) {
        status = "DUE_TODAY";
      } else {
        status = "UPCOMING";
      }

      const dueDateStr = dueDate.toISOString().split("T")[0];

      return {
        milestone,
        dueDate: dueDateStr,
        status,
        daysSinceStart: milestone.dayOffset,
      };
    });
  }

  /**
   * Create or update an org-level milestone override.
   * If the org already has a config for this milestone_key, update it.
   * Otherwise create a new override row.
   */
  static async upsertOrgMilestone(
    organisationId: string,
    data: CreateMilestoneConfigInput,
    userId: string,
    client?: PoolClient,
  ): Promise<MilestoneConfig> {
    const existing = await MilestoneConfigRepository.findByOrgAndKey(organisationId, data.milestoneKey, client);

    let config: MilestoneConfig;

    if (existing) {
      config = await MilestoneConfigRepository.update(
        existing.id,
        {
          label: data.label,
          dayOffset: data.dayOffset,
          description: data.description ?? null,
          isActive: data.isActive,
        },
        client,
      );
    } else {
      config = await MilestoneConfigRepository.create(
        {
          organisationId,
          milestoneKey: data.milestoneKey,
          label: data.label,
          dayOffset: data.dayOffset,
          description: data.description ?? null,
          isActive: data.isActive,
          createdBy: userId,
        },
        client,
      );
    }

    if (data.guidance) {
      await MilestoneService.upsertOrgGuidance(organisationId, data.milestoneKey, data.guidance, client);
    }

    return config;
  }

  /**
   * Reset an org milestone override back to default (delete the override row).
   */
  static async resetToDefault(
    configId: string,
    organisationId: string,
    _userId: string,
    client?: PoolClient,
  ): Promise<void> {
    const config = await MilestoneConfigRepository.findById(configId, client);
    if (!config) {
      throw new Error("Milestone config not found");
    }

    if (config.organisationId !== organisationId) {
      throw new Error("Milestone config does not belong to this organisation");
    }

    if (config.isDefault) {
      throw new Error("Cannot delete a system default milestone config");
    }

    await MilestoneGuidanceRepository.deleteByOrgAndKey(organisationId, config.milestoneKey, client);
    await MilestoneConfigRepository.delete(configId, client);
  }

  /**
   * Get guidance for a single milestone.
   * DB-first with hardcoded MILESTONE_GUIDANCE fallback.
   */
  static async getGuidanceForMilestone(
    milestoneKey: string,
    organisationId?: string,
    client?: PoolClient,
  ): Promise<MilestoneGuidanceContent | null> {
    const dbGuidance = await MilestoneGuidanceRepository.findByMilestoneKey(milestoneKey, organisationId, client);

    if (dbGuidance) {
      return dbGuidance;
    }

    // Fallback to hardcoded constant
    const hardcoded = MILESTONE_GUIDANCE[milestoneKey];
    return hardcoded || null;
  }

  /**
   * Get guidance for multiple milestones in one call.
   * Fetches all defaults from DB, overlays org overrides if orgId provided,
   * falls back to hardcoded constant for any missing keys.
   */
  static async getGuidanceMap(
    milestoneKeys: string[],
    organisationId?: string,
    client?: PoolClient,
  ): Promise<Record<string, MilestoneGuidanceContent>> {
    const map: Record<string, MilestoneGuidanceContent> = {};

    // Fetch DB defaults
    const defaults = await MilestoneGuidanceRepository.findDefaults(client);
    for (const d of defaults) {
      map[d.milestoneKey] = d;
    }

    // Overlay org overrides if provided
    if (organisationId) {
      const overrides = await MilestoneGuidanceRepository.findByOrganisation(organisationId, client);
      for (const o of overrides) {
        map[o.milestoneKey] = o;
      }
    }

    // Fill in any missing keys from hardcoded constant
    for (const key of milestoneKeys) {
      if (!map[key]) {
        const hardcoded = MILESTONE_GUIDANCE[key];
        if (hardcoded) {
          map[key] = hardcoded;
        }
      }
    }

    return map;
  }
}
