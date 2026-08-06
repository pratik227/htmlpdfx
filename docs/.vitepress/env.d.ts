/// <reference types="vite/client" />

/**
 * Solar icons, resolved at build time by the `hpx-icons` plugin in
 * docs/.vitepress/icons.ts. Maps a role name to an inline `<svg>` string.
 */
declare module "virtual:hpx-icons" {
  const icons: Record<string, string>;
  export default icons;
}
