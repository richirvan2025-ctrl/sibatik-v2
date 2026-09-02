import assert from "node:assert/strict";
import test from "node:test";
import { nextTicketSequence } from "../src/lib/ticket-number";

test("continues after the highest ticket number instead of using row count", () => {
  assert.equal(
    nextTicketSequence(
      ["TKT-2026-00001", "TKT-2026-00003", "TKT-2025-99999"],
      "TKT-2026-"
    ),
    4
  );
});

test("allocates a unique consecutive range for a multi-division batch", () => {
  const firstSequence = nextTicketSequence(
    ["TKT-2026-00058", "TKT-2026-00059"],
    "TKT-2026-"
  );
  const ticketNumbers = Array.from(
    { length: 6 },
    (_, index) => `TKT-2026-${String(firstSequence + index).padStart(5, "0")}`
  );

  assert.equal(new Set(ticketNumbers).size, 6);
  assert.deepEqual(ticketNumbers, [
    "TKT-2026-00060",
    "TKT-2026-00061",
    "TKT-2026-00062",
    "TKT-2026-00063",
    "TKT-2026-00064",
    "TKT-2026-00065",
  ]);
});
