const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");

const source = fs.readFileSync(path.join(__dirname, "replay.cjs"), "utf8");
const start = source.indexOf("const processRows = (parent) => {");
const end = source.indexOf("const verifyInputs = () => {", start);
assert(start > 0 && end > start, "Exact process helpers must be present");
const helpers = source.slice(start, end);
const identity = (id, created = "captured", name = "node.exe") => ({
  ProcessId: id,
  created,
  Name: name,
});
const cases = [
  {
    title: "retains captured descendants after parent exit",
    captured: [identity(100), identity(101)],
    child: { pid: 100, exitCode: 0, signalCode: null },
    live: new Map([[101, [identity(101)]]]),
    expected: [101],
  },
  {
    title: "refuses a reused parent and its unrelated descendants",
    captured: [identity(100), identity(101)],
    child: { pid: 100, exitCode: null, signalCode: null },
    live: new Map([
      [100, [identity(100, "reused"), identity(102, "unowned")]],
      [101, [identity(101)]],
      [102, [identity(102, "unowned")]],
    ]),
    expected: [101],
  },
  {
    title: "preserves an independently captured database family",
    captured: [
      identity(100),
      identity(101),
      identity(200, "database", "postgres.exe"),
    ],
    child: { pid: 100, exitCode: null, signalCode: null },
    live: new Map([
      [100, [identity(100), identity(101)]],
      [101, [identity(101)]],
      [200, [identity(200, "database", "postgres.exe")]],
    ]),
    expected: [101, 100],
  },
];
for (const fixture of cases) {
  const stopped = [];
  const sandbox = {
    assert,
    tracked: fixture.captured.slice(),
    cp: {
      spawnSync(executable, args) {
        if (executable === "powershell.exe") {
          const id = Number(/\$ids=@\((\d+)\)/.exec(args.at(-1))[1]);
          return {
            status: 0,
            stdout: JSON.stringify(fixture.live.get(id) ?? []),
          };
        }
        assert.equal(executable, "taskkill.exe");
        const id = Number(args[1]);
        stopped.push(id);
        fixture.live.delete(id);
        return { status: 0 };
      },
    },
  };
  vm.createContext(sandbox);
  vm.runInContext(
    helpers +
      "\nglobalThis.cleanup = stopOwned; globalThis.families = processFamilies;",
    sandbox,
  );
  sandbox.families.set(100, {
    parent: fixture.captured[0],
    rows: fixture.captured.filter((row) => row.ProcessId < 200),
  });
  sandbox.cleanup(fixture.child);
  assert.deepEqual(stopped, fixture.expected, fixture.title);
  console.log("PASS " + fixture.title);
}
console.log(
  "3 process-family controls passed; all process operations were simulated.",
);
