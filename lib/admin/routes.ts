export const ADMIN_BASE_PATH = "/admin";

export function adminPath(path = "") {
  const normalizedPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  if (!ADMIN_BASE_PATH) {
    return normalizedPath || "/";
  }
  return `${ADMIN_BASE_PATH}${normalizedPath}`;
}

export const ADMIN_ROUTES = {
  root: adminPath(),
  inscripciones: adminPath("/inscripciones"),
  estadisticas: adminPath("/estadisticas"),
  configuracion: adminPath("/configuracion"),
};

export function isAdminRootPath(pathname: string) {
  return pathname === ADMIN_ROUTES.root;
}
