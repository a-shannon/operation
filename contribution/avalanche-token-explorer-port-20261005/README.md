# Token explorer port proposal

Read [the proposed contract](proposal.md) and [the deployment fixtures](fixtures.json).

The checker verifies ui-kit 6.1.0's installed declarations and JavaScript, five absent-input type controls, and the existing URL producer. It does not implement a new component port. The exact input identities are in `input-pins.json`.

Run with Node 22.18.0 and the UI workspace's existing TypeScript and tsx dependencies:

```powershell
powershell -NoProfile -File <proposal-root>/replay.ps1 -UiRoot <ui-root> -FreshOutputDirectory <fresh-output-directory>
```

The output directory must be new. The checker uses only local inputs and writes its receipt there. All input labels are relative to `<ui-root>`; the current ordinary registry/build gates remain separate from this prepared graph.
