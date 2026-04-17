// Design inspired by Ketcher (EPAM Systems, Apache 2.0)
// Original: https://github.com/epam/ketcher
// Reimplemented from scratch for Kendraw.
//
// Feature flag registry for progressive rollout. Every flag is opt-in and
// defaults to disabled, so zero impact on production unless explicitly
// enabled via .env.local or VITE_* environment variable.

export type FeatureFlagName = 'newCanvas';

function readBoolEnv(raw: unknown): boolean {
  return typeof raw === 'string' && raw.toLowerCase() === 'true';
}

export const FEATURE_FLAGS: Readonly<Record<FeatureFlagName, boolean>> = {
  newCanvas: readBoolEnv(import.meta.env.VITE_ENABLE_NEW_CANVAS),
};

export function isFeatureEnabled(name: FeatureFlagName): boolean {
  return FEATURE_FLAGS[name] === true;
}
