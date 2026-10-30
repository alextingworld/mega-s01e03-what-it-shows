// What one big ticket actually holds: each report placed with the problem it reports.
// causes.ts places a report by its tenant; the desk's notes (desk-notes.json) mark the reports that
// describe a one-day move instead of a swapped day and month. Those are their own problem, not a
// footnote under the cause their tenant would give them.
import { causeOf, uniqueById, type Cause, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = Cause | 'shift' | 'unplaced';

export const PROBLEMS: Record<Problem, { title: string; what: string }> = {
  parser: {
    title: 'The shared parser reads dates month first',
    what: 'A day-first tenant books 7 April; the invite says 4 July.',
  },
  hint: {
    title: 'booking-v3 tells day-first tenants to type MM/DD/YYYY',
    what: 'Only through the booking-v3 form: people type what the hint says, the form reads it day first.',
  },
  shift: {
    title: 'Some dates move by one day',
    what: 'Tuesday becomes Monday; two clients of one meeting get different days. Not a swap: a time zone problem.',
  },
  unplaced: {
    title: 'No tenant on file',
    what: 'Cannot be placed until the tenant is known.',
  },
};

export type ProblemGroup = {
  problem: Problem;
  reports: Report[];
  tenants: string[];
  channels: Record<string, number>;
  firstSeen: string;
  lastSeen: string;
};

export function problemOf(r: Report, t: Tenant | undefined, oneDayMove: readonly string[]): Problem {
  if (oneDayMove.includes(r.id)) return 'shift';
  return causeOf(r, t) ?? 'unplaced';
}

export function splitTicket(
  all: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): { reports: Report[]; groups: ProblemGroup[] } {
  const reports = uniqueById(all).filter((r) => r.mergedInto === ticket);
  const by = new Map<Problem, Report[]>();
  for (const r of reports) {
    const p = problemOf(r, tenantOf(r), oneDayMove);
    by.set(p, [...(by.get(p) ?? []), r]);
  }
  const groups = [...by.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        problem,
        reports: rs,
        tenants: [...new Set(rs.map((r) => r.tenant))].sort(),
        channels: rs.reduce<Record<string, number>>((n, r) => ({ ...n, [r.channel]: (n[r.channel] ?? 0) + 1 }), {}),
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
      };
    })
    .sort((a, b) => b.reports.length - a.reports.length);
  return { reports, groups };
}
