# Rosen Service process replay source series

Apply the eleven-file replay contribution to the pinned Operation checkout.
The verifier uses a fresh scratch directory and preserves the source index:

```powershell
node ./verify.mjs $RepositoryParent $NewScratchDirectory
```

The resulting contribution/service-mainnet-replay-20261005/README.md gives the
parameterized process command. Supply the prepared Service/scanner/calculator
dependency graph and Windows Node22.18.0, npm11.6.2 and PostgreSQL17 binaries.
No dependency is installed by the replay or patch verifier.

Five actual process phases pass: first startup, PostgreSQL/Service restart,
persisted hold refusal, wrong chain refusal and a scanner-update fault refusal.
The synthetic mainnet43114 fixture covers AVAX and JOE accounting. Three
source-owned and eight independently reviewed mocked process-family controls
pass. validation.json binds the retained process and source evidence.

The eight unrelated legacy starts remain isolated. Prepared installed bytes,
captured sequential process families and local replay do not establish ordinary
registry installation, whole-Service acceptance, release or production activation.
