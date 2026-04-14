/**
 * Feature Flag Management System
 * Allows for enabling/disabling features without redeploying.
 */

type FeatureFlag = 
  | "DISABLE_PDF" 
  | "ENABLE_RATE_LIMIT" 
  | "STRICT_LOGGING" 
  | "SHOW_SYSTEM_DASHBOARD";

const FLAGS: Record<FeatureFlag, boolean> = {
  DISABLE_PDF: process.env.NEXT_PUBLIC_DISABLE_PDF === "true",
  ENABLE_RATE_LIMIT: process.env.NEXT_PUBLIC_ENABLE_RATE_LIMIT !== "false", // Default ON
  STRICT_LOGGING: process.env.NEXT_PUBLIC_STRICT_LOGGING === "true",
  SHOW_SYSTEM_DASHBOARD: process.env.NEXT_PUBLIC_SHOW_SYSTEM_DASHBOARD !== "false", // Default ON
};

/**
 * Checks if a feature flag is enabled.
 */
export function getFeatureFlag(name: FeatureFlag): boolean {
  // Supports runtime overrides via window object if in browser
  if (typeof window !== "undefined") {
    const overrides = (window as any).__FEATURE_FLAGS_OVERRIDES;
    if (overrides && typeof overrides[name] === "boolean") {
      return overrides[name];
    }
  }
  
  return FLAGS[name];
}
