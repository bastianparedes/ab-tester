export function extendPathURL(base: URL, extraPath: string) {
  const url = new URL(base);

  const basePath = url.pathname.endsWith('/') ? url.pathname.slice(0, -1) : url.pathname;

  const extra = extraPath.startsWith('/') ? extraPath.slice(1) : extraPath;

  url.pathname = `${basePath}/${extra}`;

  return url;
}
