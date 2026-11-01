/**
 * Catalog assembly.
 *
 * Each locale folder exports a bundle built from its own JSON files; this module
 * holds the merge logic so the per-locale bundles stay declarative.
 */

type Dict = { [key: string]: any };

function isPlainObject(value: unknown): value is Dict {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

/** Recursively merge `extra` into `base` (extra wins, arrays are replaced). */
export function deepMerge(base: Dict, extra: Dict): Dict {
  const out: Dict = { ...base };
  for (const [key, value] of Object.entries(extra || {})) {
    if (isPlainObject(value) && isPlainObject(out[key])) {
      out[key] = deepMerge(out[key], value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

/**
 * Merge the legacy base catalog with every section file.
 * Later fragments win, which is why section files can override base keys.
 */
export function buildBundle(base: Dict, ...fragments: Dict[]): Dict {
  return fragments.reduce<Dict>((acc, fragment) => deepMerge(acc, fragment), { ...base });
}
