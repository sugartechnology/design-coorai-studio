import "server-only";

import { headers } from "next/headers";
import type { PortalTemplate } from "./schema";
import {
  normalizeHost,
  parsePortalTemplate,
} from "./schema";
import bellonaJson from "./bellona.json";
import istikbalJson from "./istikbal.json";

export interface TemplateProvider {
  getByHost(host: string): Promise<PortalTemplate>;
  getById(id: string): Promise<PortalTemplate | null>;
}

const FALLBACK_ID = "istikbal";

const staticTemplates: PortalTemplate[] = [
  parsePortalTemplate(istikbalJson),
  parsePortalTemplate(bellonaJson),
];

const templatesById = new Map(
  staticTemplates.map((template) => [template.id, template]),
);

function hostMatches(template: PortalTemplate, host: string): boolean {
  const needle = normalizeHost(host);
  return template.hosts.some((entry) => normalizeHost(entry) === needle);
}

export class StaticJsonTemplateProvider implements TemplateProvider {
  async getById(id: string): Promise<PortalTemplate | null> {
    return templatesById.get(id) ?? null;
  }

  async getByHost(host: string): Promise<PortalTemplate> {
    const match = staticTemplates.find((template) => hostMatches(template, host));
    return match ?? templatesById.get(FALLBACK_ID)!;
  }
}

/**
 * Same PortalTemplate contract as static JSON. Wire GET /templates?host=
 * (or GET /templates/:id) here later; fall back to static on failure.
 */
export class RemoteTemplateProvider implements TemplateProvider {
  constructor(private readonly fallback: TemplateProvider) {}

  async getById(id: string): Promise<PortalTemplate | null> {
    return this.fallback.getById(id);
  }

  async getByHost(host: string): Promise<PortalTemplate> {
    return this.fallback.getByHost(host);
  }
}

const staticProvider = new StaticJsonTemplateProvider();

export const templateProvider: TemplateProvider = staticProvider;

function overrideId(): string | null {
  const raw = process.env.BRAND_OVERRIDE?.trim().toLowerCase();
  return raw || null;
}

export async function readRequestHost(): Promise<string | null> {
  try {
    const h = await headers();
    const forwarded = h.get("x-forwarded-host");
    const host = forwarded?.split(",")[0]?.trim() || h.get("host");
    return host || null;
  } catch {
    return null;
  }
}

export async function getPortalTemplate(): Promise<PortalTemplate> {
  const forced = overrideId();
  if (forced) {
    const byId = await templateProvider.getById(forced);
    if (byId) return byId;
  }
  const host = await readRequestHost();
  if (!host) {
    return (await templateProvider.getById(FALLBACK_ID))!;
  }
  return templateProvider.getByHost(host);
}
