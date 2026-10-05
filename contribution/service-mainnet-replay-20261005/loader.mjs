const legacy = new Set([
  "ergo",
  "cardano",
  "bitcoin",
  "ethereum",
  "binance",
  "doge",
  "firo",
  "handshake",
]);
/** Isolates only explicitly unrelated process starts; no package or protected source entry redirection. */
export async function resolve(specifier, context, nextResolve) {
  if (
    context.parentURL ===
      new URL(
        "file:///" +
          process.env.SERVICE_FIXTURE_ROOT.replaceAll("\\", "/") +
          "/src/scanner/scanner-service.ts",
      ).href &&
    specifier.startsWith("./chains/") &&
    legacy.has(specifier.slice("./chains/".length))
  )
    return {
      url: new URL(
        "./legacy.mjs?chain=" + specifier.slice("./chains/".length),
        import.meta.url,
      ).href,
      shortCircuit: true,
    };
  return nextResolve(specifier, context);
}
/** Applies a single actual created-scanner update fault only in the declared negative phase. */
export async function load(url, context, nextLoad) {
  const result = await nextLoad(url, context);
  if (
    process.env.SERVICE_FIXTURE_MUTANT === "scanner-update-noop" &&
    url ===
      new URL(
        "file:///" +
          process.env.SERVICE_FIXTURE_ROOT.replaceAll("\\", "/") +
          "/src/avalanche/scanner.ts",
      ).href
  ) {
    const source = Buffer.from(result.source).toString("utf8"),
      marker = "await scanner.registerExtractor(";
    if (source.split(marker).length - 1 !== 1)
      throw Error("One-fault marker count");
    return {
      ...result,
      source: source.replace(
        marker,
        "scanner.update = async () => {}; " + marker,
      ),
    };
  }
  return result;
}
