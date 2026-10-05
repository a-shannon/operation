# UI contribution series

This source series starts from UI commit
`d62818e0c5e3e3452454f07def81059b14c784f9`. Apply its six groups in manifest
order: shared interfaces, statistics, EVM bounds, existing Guard balance
components, Utils explorer producer, then Avalanche consumers.

Verify exact application without modifying the source repository:

```text
node verify.mjs <repository-parent> <fresh-scratch-directory>
```

The repository parent must contain `ui` at the pinned commit. The verifier
checks patch hashes, input/output trees and every changed file. It refuses an
existing scratch directory or source drift. The Utils prerequisite includes
the helper, its public export, four direct cases and their public Vitest
configuration; the consumer can build after that producer.

The complete Changesets plan covers 86 notes across 42 packages. It plans
Utils 1.2.0, Avalanche 0.1.0 and Guard 4.5.3. Avalanche requires Utils `^1.2.0`,
Guard requires Avalanche `^0.1.0`, and Rosen Service requires the observation
extractor 7.2.0. Current source versions stay unchanged until the complete
Changesets version operation.

The lock prepares genuine relative workspace links and dependency floors. Its
existing registry resolutions remain unchanged, including the older extractor
resolution. Resolve the final release lock after the exact producer releases,
then validate ordinary `npm ci`, producer package builds and their downstream
network, Service, wallet and app builds. Local source tests do not establish
released registry installation, upstream acceptance or operational activation.

Guard balance consumers use the existing Networks cards and separate hot/cold
Assets tables. They retain exact cached wrapped integers and mapped significant
decimals. Explorer links require the backend's validated deployment ID. Higher
decimals than 99 remain unavailable through the existing Amount component.
Refresh or rebuild cached balances after replacing mapping or custody-address
policy before accepting displayed amounts as current.

Production contracts, token mappings, addresses, endpoint selection, keys and
release/activation approvals remain operator inputs. The source series includes
local contributor preparation and introduces no production configuration claim.
