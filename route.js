// Pure project-route classification. Never reads or changes history, the URL, or the document.
// kind: 'supported' (a registered project slug), 'invalid' (a project parameter is present but is empty, unknown,
// or malformed), or 'none' (no project parameter). Only the first project value counts, as in V1.
export function classifyProjectRoute(href, routes) {
  let params;
  try { params = new URL(href).searchParams; } catch { return { kind: 'none', slug: null, id: null }; }
  if (!params.has('project')) return { kind: 'none', slug: null, id: null };
  const slug = params.get('project');
  if (slug && Object.hasOwn(routes, slug)) return { kind: 'supported', slug, id: routes[slug] };
  return { kind: 'invalid', slug: null, id: null };
}
