export async function resolve(specifier, context, nextResolve) {
  if (
    (specifier.startsWith("./") || specifier.startsWith("../")) &&
    !/\.(ts|tsx|js|mjs|cjs|json|node)$/.test(specifier)
  ) {
    try {
      return await nextResolve(`${specifier}.ts`, context);
    } catch (err) {
      if (err && err.code !== "ERR_MODULE_NOT_FOUND") throw err;
      return nextResolve(`${specifier}/index.ts`, context);
    }
  }
  return nextResolve(specifier, context);
}
