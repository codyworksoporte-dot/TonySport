/** Next replaces this build-time value in server output and client bundles. */
export function siteAsset(path: `/assets/${string}`): string {
  return `${process.env.TONY_ASSET_BASE || ''}${path}`;
}
