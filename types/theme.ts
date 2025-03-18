/**
 * Theme Types
 *
 * Common type definitions for theme-related properties
 */

/**
 * Theme color configuration
 */
export type ThemeColorConfig = {
  light?: string;
  dark?: string;
};

/**
 * Theme color keys
 */
export type ThemeColorKey =
  | "text"
  | "background"
  | "tint"
  | "tabIconDefault"
  | "tabIconSelected";

/**
 * Theme mode
 */
export type ThemeMode = "light" | "dark";

/**
 * Theme configuration
 */
export interface ThemeConfig {
  mode: ThemeMode;
  colors: Record<ThemeColorKey, string>;
}
