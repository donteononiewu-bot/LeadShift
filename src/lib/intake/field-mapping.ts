export interface IntegrationConfig {
  fieldMapping?: Record<string, string>;
  requiredFields?: string[];
}

/** Reads a dot-notation path (supports numeric array indices) out of a JSON object. */
export function getPath(obj: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>((value, key) => {
      if (value === null || value === undefined) return undefined;
      if (Array.isArray(value)) {
        const index = Number(key);
        return Number.isInteger(index) ? value[index] : undefined;
      }
      if (typeof value === "object") {
        return (value as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
}

export const LEAD_FIELDS = [
  "name",
  "email",
  "phone",
  "state",
  "zip",
  "productType",
  "dateOfBirth",
] as const;
export type LeadField = (typeof LEAD_FIELDS)[number];

export interface MappedLead {
  name: string | null;
  email: string | null;
  phone: string | null;
  state: string | null;
  zip: string | null;
  productType: string | null;
  dateOfBirth: string | null;
}

export function applyFieldMapping(
  payload: Record<string, unknown>,
  fieldMapping: Record<string, string>
): MappedLead {
  const result: MappedLead = {
    name: null,
    email: null,
    phone: null,
    state: null,
    zip: null,
    productType: null,
    dateOfBirth: null,
  };

  for (const field of LEAD_FIELDS) {
    const path = fieldMapping[field];
    if (!path) continue;
    const value = getPath(payload, path);
    if (value !== undefined && value !== null) {
      result[field] = String(value);
    }
  }

  return result;
}

/** Returns the list of required-field paths missing from the payload. */
export function findMissingFields(
  payload: Record<string, unknown>,
  requiredFields: string[]
): string[] {
  return requiredFields.filter((path) => {
    const value = getPath(payload, path);
    return value === undefined || value === null || value === "";
  });
}
