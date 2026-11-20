async function register() {
  const { test } = await import('node:test');
  const assert = (await import('node:assert/strict')).default;
  const { loadTs } = await import('../auth/load-ts.mjs');
  const { calendarDate, calendarDays, dateInRange } = loadTs('lib/date-control.ts');
  test('calendar uses calendar dates without UTC shifts and handles leap years', () => {
    assert.equal(calendarDate(2026, 0, 1), '2026-01-01');
    assert.equal(calendarDate(25, 10, 9), '0025-11-09');
    const leap = calendarDays(2024, 1).filter(Boolean);
    const regular = calendarDays(2026, 1).filter(Boolean);
    assert.equal(leap.length, 29);
    assert.equal(leap.at(-1), '2024-02-29');
    assert.equal(regular.length, 28);
    assert.equal(calendarDays(2026, 10)[0], '2026-11-01');
    assert.equal(calendarDays(2026, 7).length, 42);
  });
  test('date picker preserves inclusive limits for both date and datetime fields', () => {
    assert.equal(dateInRange('2026-11-09', '2026-11-10', '2026-12-15'), false);
    assert.equal(dateInRange('2026-11-10', '2026-11-10', '2026-12-15'), true);
    assert.equal(dateInRange('2026-12-15', '2026-11-10', '2026-12-15'), true);
    assert.equal(dateInRange('2026-12-16', '2026-11-10', '2026-12-15'), false);
    assert.equal(dateInRange('2026-11-10', '2026-11-10T12:30', '2026-12-15T10:30'), true);
  });
}
register();
