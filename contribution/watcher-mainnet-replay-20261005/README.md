# Avalanche Watcher process replay

Run with Node 22.18.0. Supply the Watcher checkout and npm 11.6.2 CLI; the checkout must already have its prepared scanner, extractor, codec, token, ORM and SQLite dependencies installed.

```powershell
& $Node22 ./replay.cjs --watcher-root $WatcherCheckout --npm-cli $NpmCli --work-root $TemporaryDirectory --receipt $NewReceiptFile
```

Use a new receipt filename. The work directory needs 10 GiB free. Process tracking currently requires Windows PowerShell and taskkill. Nothing is installed.

The replay copies the checkout's source and configuration into a fresh temporary directory, verifies identical bytes, connects its existing dependencies, and runs the declared `npm start` command. Its synthetic C-Chain identity is mainnet 43114. The complete contracts and token map include AVAX and mapped JOE. The tested lock transfers 100000000000 raw JOE units and produces normalized observation amount 100, bridge fee 2 and network fee 3, with an invented Ergo counterpart.

Four phases must pass: first startup, restart against the same SQLite database, a receipt with `removed=true`, and a receipt without the `removed` flag. The latter two must complete the extractor frontier without storing an observation. An owned loopback RPC supplies the frozen transaction and receipt; all outbound transport is restricted to its port and the local API port.

Ten unrelated jobs, fee initialization and the Ergo scanner update are isolated explicitly. This checks Avalanche scanning, extraction, persisted qualification and restart through the real Watcher entry point. Wallet operations, live fees, Ergo scanning and combined service health need separate qualification. Prepared dependencies also leave the ordinary registry installation gate open.

Receipts bind copied source, deciding dependency bytes, support files, process lifecycle and persisted state. The replay stops its owned processes and RPC listener in `finally`. Runtime logs, databases and receipts stay in the temporary directory for inspection; keep them outside contribution source and version control.
