# Checklist: Report Ready for Testing (Ready for Testing) — extended version
# Purpose: quick and unambiguous assessment whether a task/report is ready to start testing
# Convention:
# - [ ] = to do / to be confirmed
# - [x] = confirmed
# - (EVIDENCE) = place for proof: link, screenshot, export, query, job-id, ticket

---

## 1) Report identification and test scope
- [ ] The report is uniquely identified (name/ID/link/path). (EVIDENCE)
- [ ] The purpose of the report is defined (what decision it supports / who uses it).
- [ ] Test scope is defined (in-scope / out-of-scope).
- [ ] Acceptance Criteria (AC) are defined in a testable, measurable way.
- [ ] Each AC is mapped to a metric/field/section of the report and a verification method (e.g. SQL, comparison). (EVIDENCE)
- [ ] Test environment and version/build are specified (release tag/commit). (EVIDENCE)
- [ ] Report owner (business/product) is identified for clarifications and sign-off.

---

## 2) Test data availability and preparation
- [ ] Test data is available in the test environment (not “will be available”).
- [ ] Data sources are defined (systems/tables/views) with ownership (data owner).
- [ ] Test data covers equivalence partitions, at minimum:
  - [ ] no data (empty set)
  - [ ] single record
  - [ ] typical/normal data
  - [ ] edge/extreme data (min/max, large volumes)
  - [ ] NULL / 0 / negative values (if applicable)
- [ ] Boundary values are covered for filters and parameters (dates, thresholds, limits).
- [ ] Negative scenarios are covered (invalid statuses, broken relations, missing references).
- [ ] Data refresh mechanism is defined (ETL/CDC) and data freshness is known. (EVIDENCE)
- [ ] If data is masked/anonymized: confirmed that business logic, joins, and metrics are unaffected.
- [ ] If sensitive data is required: access and compliance (e.g. GDPR) are confirmed.

---

## 3) Expected results / Source of Truth
- [ ] A source of truth for comparison is defined (at least one):
  - [ ] reference SQL query
  - [ ] previous version of the report
  - [ ] another system (golden source)
  - [ ] documented KPI/metric definitions
- [ ] Tolerance rules are defined (rounding, currency, timezone, ETL latency).
- [ ] Definition of “match” is agreed (exact match vs acceptable delta). (EVIDENCE)
- [ ] Duplicate handling and reconciliation rules are defined.
- [ ] Data cut-off times and reporting windows are defined (e.g. D-1, T-2h).

---

## 4) Fields, metrics, and business rules
- [ ] Complete list of fields/columns/sections to be validated is available.
- [ ] For each field: data type, format, and allowed values (domain) are defined.
- [ ] For calculated fields: formula, conditions, precedence, and rounding are defined. (EVIDENCE)
- [ ] Rules for NULL/blank/0 values are defined (presentation and semantics).
- [ ] Filtering rules are defined (when records are included/excluded).
- [ ] Aggregation rules are defined (sum/count/distinct, grouping levels).
- [ ] Sorting and pagination rules are defined (result stability).
- [ ] Metric definitions are consistent across reports (if reused elsewhere). (EVIDENCE)
- [ ] Timezone and calendar rules are confirmed (business day, fiscal calendar, DST). (EVIDENCE)

---

## 5) Report execution (Invocation)
- [ ] Step-by-step instructions for running the report are available (UI/API/scheduler). (EVIDENCE)
- [ ] Required parameters and test values are defined (dates, ranges, filters, segments).
- [ ] Access rights are confirmed: test account can run the report and access data. (EVIDENCE)
- [ ] It is confirmed whether the report runs synchronously or asynchronously (job/queue).
- [ ] If asynchronous: job identification and tracking method is known (job-id/correlation-id). (EVIDENCE)
- [ ] Error handling behavior is defined (retry, timeout, messages, partial results).
- [ ] Limits are defined (max date range, max rows, API rate limits), if applicable.

---

## 6) Access to report data (Extraction / Inspection)
- [ ] Method to extract data for validation is defined (CSV/XLSX/PDF export, API, semantic layer).
- [ ] Location and method to validate data at the source are defined (tables/views/logs).
- [ ] Ability to run validation queries (read-only) is available, or a responsible contact is defined.
- [ ] Minimum set of test evidence is defined:
  - [ ] report export
  - [ ] reference query and result
  - [ ] execution parameters
  - [ ] job-id / timestamp
- [ ] Export consistency is confirmed (export ≡ UI view; formatting/rounding differences understood).

---

## 7) Dependencies and impact analysis
- [ ] Upstream dependencies are identified (ETL jobs, intermediate tables, data models).
- [ ] Downstream dependencies are identified (dependent reports, dashboards, integrations).
- [ ] Impact analysis on KPIs/metrics is completed (semantic vs visual changes). (EVIDENCE)
- [ ] Minimal regression scope for dependent reports is defined.
- [ ] If joins/keys are affected: duplication and data loss risks are assessed.
- [ ] If filters change: population definition consistency is confirmed.

---

## 8) Testing and analytical techniques — coverage requirements
- [ ] Equivalence Partitioning applied to data and filters (documented classes). (EVIDENCE)
- [ ] Boundary Value Analysis applied to parameters and aggregations. (EVIDENCE)
- [ ] Reconciliation performed: report vs independent source (SQL/golden source/previous version). (EVIDENCE)
- [ ] End-to-end traceability executed for at least one record (source → transform → report). (EVIDENCE)
- [ ] Short exploratory testing session executed (anomalies, spikes, empty values, sorting, filters). (EVIDENCE)
- [ ] Test priorities defined using risk-based approach (high-risk areas = deeper coverage). (EVIDENCE)

---

## 9) Performance, stability, and non-functional aspects
- [ ] Performance expectations (SLA) are defined: generation time, timeout, data volume.
- [ ] Behavior with large volumes is validated (pagination, export limits, memory usage).
- [ ] Result consistency across repeated executions is confirmed (determinism/caching).
- [ ] Security requirements are confirmed (roles, field visibility, multi-tenant, row-level security). (EVIDENCE)
- [ ] Auditability is confirmed (who ran the report, when, with which parameters), if required.

---

## 10) Defects, reporting, and exit criteria
- [ ] Defect reporting format is agreed (parameters, export, query, timestamp, job-id).
- [ ] Acceptance authority for test results is defined (sign-off owner).
- [ ] Test “Done” criteria are defined:
  - [ ] AC coverage
  - [ ] technique coverage (partitions/boundaries/reconciliation/traceability)
  - [ ] no critical defects / accepted exceptions
- [ ] All test evidence is collected and linked to the task. (EVIDENCE)

---

## Quick Gate — “Can testing start?”
- [ ] I have test data and know how to validate it at the source.
- [ ] I have a source of truth (SQL/reference report) and tolerance rules.
- [ ] I have a list of fields/metrics and business rules.
- [ ] I know how to run the report (parameters, roles, job-id) and extract results.
- [ ] I know dependencies and the minimal regression scope.
