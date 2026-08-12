# ADR-0001 — Modular monolith before microservices

Status: Accepted

## Context
Growth Compass is in beta but is intended to become a globally available multi-user product. The product needs strong change isolation without taking on premature distributed-systems complexity.

## Decision
Use a modular monolith with strict bounded modules, explicit public contracts, registries/composition roots, event-driven cross-module communication, module-owned data/migrations, boundary tests, and feature/module enablement.

Do not split business capabilities into separate network services merely to achieve modularity.

## Why
A modular monolith provides:
- one deployment and operational surface while the product changes rapidly;
- transactions and consistency without distributed coordination;
- simpler local development and preview environments;
- enforceable code/data boundaries;
- a clear extraction path later because consumers already depend on public contracts rather than internals.

## Extraction criteria
A module may become a separate Worker/service when one or more are materially true:
- independent scaling is required;
- stronger security/isolation boundaries are required;
- a separate team needs independent deployment ownership;
- failure isolation requires a process/service boundary;
- workload/runtime requirements differ materially;
- operational evidence justifies the additional network, observability, deployment, and consistency complexity.

## Consequences
- Composition roots are allowed to know installed modules; core is not.
- Module catalogs are intentional single change points.
- Cross-module private imports and direct private-table reads are prohibited.
- Contract and boundary tests are mandatory.
- Future service extraction should preserve the same contract so consumers do not require a product-wide rewrite.
