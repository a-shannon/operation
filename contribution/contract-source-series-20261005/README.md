# Avalanche contract preparation

From this directory, apply the one group with:

```sh
node verify.mjs <repository-parent> <fresh-scratch-directory>
```

The repository parent must contain `contract` at baseline
`4302d8d34020b0012c3fcb25d7484aa602813cab`. The scratch directory must be absent,
outside the original repository, with an existing parent. The verifier creates
a local clone, checks the five changed paths and writes verification.json.
The resulting tree is `b7a81f0408026c99e4a3a520e01c4150ccb56421`; manifest
SHA-256 is `55436e3be6414d2b6e971c54b4a682933e624f4cc36e243eeb12c9809bf25424`.

The group adds two offline preparation tools, two focused suites and a
synthetic assigned-value example. Build files, helpers and ten Ergo scripts
retain their baseline text. validation.json records the 20 baseline input
relations and reviewed Windows CRLF-to-LF differences.

With Java 8 and the cached SBT 1.5.8/Scala 2.12.7/AppKit 5.0.0 dependency
graph, run from `<fresh-scratch-directory>/contract`:

```sh
sbt -Dsbt.offline=true 'set offline := true' 'set Test / parallelExecution := false' 'testOnly contracts.AvalanchePreparationSpec contracts.AvalancheOverlayMergeSpec'
```

The exact exported source passes 62/62 tests in two suites with serialized
execution. The initial concurrent result is preserved: 61/62 passed, with
`_sourceContext can be set only once` from the shared compiler path. Serialization
is an SBT session setting; source and build files are unchanged. This replay
qualifies the cached local graph, not a fresh dependency resolution.

See [the preparation guide](../../docs/avalanche-contract-preparation.md) for
generation, deployment-preserving merge, assigned inputs and acceptance.
Prior independent merge40 and preparation22 evidence is preserved. Actual
minting, deployment and key ceremony require Rosen outputs.
