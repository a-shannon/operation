# Avalanche Rosen Service process replay

Check process-family cleanup without starting or stopping real processes:

```powershell
& $Node22 ./owned-processes.spec.cjs
```

These controls retain captured descendants after their parent exits, refuse a
reused parent PID and preserve an independently tracked PostgreSQL family.

Run with Node 22.18.0 on Windows. Supply the Rosen Service checkout, the source workspace containing the scanner and asset-calculator packages, a prepared dependency directory, npm 11.6.2, and PostgreSQL 17 binaries. Nothing is installed.

```powershell
& $Node22 ./replay.cjs `
  --service-root $ServiceCheckout `
  --source-root $SourceWorkspace `
  --dependency-root $PreparedNodeModules `
  --node $Node22 `
  --npm-cli $NpmCli `
  --postgres-bin $PostgresBin `
  --scratch $NewScratchDirectory `
  --receipt $NewReceiptFile
```

The scratch directory and receipt must be new, with existing parents outside the supplied source and dependency directories. Keep both outside contribution source and version control. Both output volumes need at least 10 GiB free; process tracking uses PowerShell and `taskkill`.

The runner copies the Service source, configuration and package manifest into scratch, connects the supplied dependencies read-only, and runs the declared `npm run start:prod` command. An owned loopback RPC serves a synthetic C-Chain mainnet identity, chain ID 43114. The AVAX and JOE fixtures produce one JOE observation, two locked-asset rows and two bridged-asset rows through the actual scanner, extractor, calculator and PostgreSQL datasource.

Five phases are checked. First startup must reach healthy Avalanche scanner readiness. A PostgreSQL restart and a separate Service process must retain the same state, block, observation, asset, bridged-asset and token rows. Persisted holds and a wrong chain ID must refuse startup before any calculator balance or supply reads. A single no-op fault on the created scanner's update must also refuse readiness and calculator reads.

Eight unrelated chain start functions are isolated explicitly. Their jobs and combined service health need separate qualification. This replay also leaves normal registry installation, whole-Service acceptance and production activation open. It uses synthetic addresses, token counterparts and proofs; it performs no live signing, broadcast, deployment or funds operations.

Receipts pin the copied source, dependency bytes, support files, generated copies and toolchain. Every outbound HTTP, fetch and socket connection is restricted to the owned loopback ports. The RPC fixture limits requests to 128 KiB, batches to 64 calls, connections to 16 and total requests to 5,000, with 15-second socket and request timeouts. The runner stops its captured process identities, stops its fresh PostgreSQL cluster, closes the RPC listener, removes the ephemeral password file and checks that source and dependency bytes are unchanged. Logs and database files remain in scratch for inspection.
