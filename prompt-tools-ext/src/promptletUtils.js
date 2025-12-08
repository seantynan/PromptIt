// =========================================================================
// PromptIt Promptlet Utilities
// Shared helpers for combining and normalizing promptlet data
// =========================================================================

function normalizePromptlet(promptlet, index, { isDefault, fillCreatedAt }) {
  const base = {
    ...promptlet,
    isDefault,
    isActive: promptlet.isActive !== false,
    createdAt: fillCreatedAt
      ? (promptlet.createdAt || (isDefault ? 0 : Date.now()))
      : promptlet.createdAt,
  };

  if (isDefault) {
    base.defaultIndex = promptlet.defaultIndex ?? index;
  } else {
    base.customIndex = promptlet.customIndex ?? index;
  }

  return base;
}

/**
 * Combines stored default and custom promptlets into unified collections.
 *
 * @param {object} data Storage payload containing promptlet buckets or legacy promptlets array.
 * @param {object} [options]
 * @param {boolean} [options.fillCreatedAt=false] When true, ensure a stable createdAt for sorting.
 * @returns {{allPromptlets: Array, defaults: Array, customs: Array}}
 */
function combineStoredPromptlets(data, { fillCreatedAt = false } = {}) {
  const storedDefaults = Array.isArray(data.defaultPromptlets)
    ? data.defaultPromptlets
    : null;
  const storedCustoms = Array.isArray(data.customPromptlets)
    ? data.customPromptlets
    : null;

  if (storedDefaults || storedCustoms) {
    const defaults = (storedDefaults || []).map((promptlet, index) =>
      normalizePromptlet(promptlet, index, { isDefault: true, fillCreatedAt })
    );

    const customs = (storedCustoms || []).map((promptlet, index) =>
      normalizePromptlet(promptlet, index, { isDefault: false, fillCreatedAt })
    );

    return { allPromptlets: [...defaults, ...customs], defaults, customs };
  }

  const legacyPromptlets = data.promptlets || [];
  const defaults = legacyPromptlets
    .filter((promptlet) => promptlet.isDefault)
    .map((promptlet, index) =>
      normalizePromptlet(promptlet, index, { isDefault: true, fillCreatedAt })
    );
  const customs = legacyPromptlets
    .filter((promptlet) => !promptlet.isDefault)
    .map((promptlet, index) =>
      normalizePromptlet(promptlet, index, { isDefault: false, fillCreatedAt })
    );

  return { allPromptlets: [...defaults, ...customs], defaults, customs };
}
