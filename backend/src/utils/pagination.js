export function getPagination(query) {
  const limit = Math.min(Math.max(parseInt(query.limit, 10), 1), 100);
  const page = Math.max(parseInt(query.page || "1", 10), 1);
  return { limit, page };
}
