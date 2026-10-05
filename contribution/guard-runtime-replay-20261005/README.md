# Guard focused runtime replay

Run the six affected source-owned Guard suites against the thirteen-group applied source tree:

```shell
node replay.mjs <guard-repository-root> <fresh-output-directory>
```

Use Node 22.18.0. The Guard repository must have the exact source files in `input-pins.json` and its prepared installed dependency graph. The recipe checks the selected source and tool bytes before and after execution. The output parent must already exist, have 10 GiB free, and be outside the source and dependency packages. The output directory must be new.

The recipe runs the existing Vitest 3.1.4 CLI from the selected Guard installation. It selects the service directory and its `config` directory explicitly, uses the existing two setup files, and retains the three Ergo source aliases used by the validated prerequisite join. One worker executes the same six files, with expected counts totaling 147. Result caching is disabled; Vite cache, configuration temporary files, JSON results and logs are written under the fresh output directory. Only three dependency-package links are created there.

`receipt.json` reports individual file counts, exit status and unchanged inputs. `tests.json`, `stdout.log` and `stderr.log` retain the full local result. A 240-second child timeout or process error fails qualification; individual tests retain their 10-second limit. If the final JSON report is missing, counts remain unavailable rather than implying that no tests executed. The six suites overlap the earlier 529 scoped controls. This replay qualifies the selected source with the prepared dependency graph; ordinary registry installation, full Guard jobs and genuine signing shares remain separate gates.
