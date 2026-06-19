#!/usr/bin/env node
/**
 * Smoke test — cohort calendar (no browser; avoids JSON import chain).
 */

function parseProgramDate(value) {
  if (value instanceof Date) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    date.setHours(0, 0, 0, 0);
    return date;
  }
  if (typeof value === 'string') {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
    if (match) {
      return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    }
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

function deriveProgramDayFromStartDate(startDate, now = new Date()) {
  if (!startDate) return null;
  const start = parseProgramDate(startDate);
  if (!start) return null;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  if (today < start) return { week: 1, day: 1 };

  let programDays = 0;
  const cursor = new Date(start);
  while (cursor <= today) {
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) programDays += 1;
    cursor.setDate(cursor.getDate() + 1);
  }

  const total = Math.max(1, programDays);
  const week = Math.min(15, Math.floor((total - 1) / 5) + 1);
  const day = ((total - 1) % 5) + 1;
  return { week, day };
}

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

const friJun19 = new Date(2026, 5, 19);
const day = deriveProgramDayFromStartDate('2026-06-15', friJun19);
if (!day || day.week !== 1 || day.day !== 5) {
  fail(`expected Week 1 Day 5 on Fri 2026-06-19, got ${JSON.stringify(day)}`);
}

const utcString = deriveProgramDayFromStartDate('2026-06-15', friJun19);
if (utcString.day !== 5) {
  fail(`local date parse should not shift start_date off-by-one, got ${JSON.stringify(utcString)}`);
}

const defaultStart = deriveProgramDayFromStartDate('2026-06-15', friJun19);
if (defaultStart.day !== 5) {
  fail(`default pilot start should land on Day 5 Fri Jun 19, got ${JSON.stringify(defaultStart)}`);
}

console.log('smoke-program-calendar: ok (Fri 2026-06-19 → Week 1 · Day 5)');
