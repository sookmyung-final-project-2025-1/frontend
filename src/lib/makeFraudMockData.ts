export type Point = {
  date: string;
  isFraudMean: number;
  transactionAmtMean: number;
};

export function makeFraudAmtData(start = '2018-01-01', days = 200): Point[] {
  const startDate = new Date(start);
  const out: Point[] = [];

  const clamp = (v: number, lo: number, hi: number) =>
    Math.min(hi, Math.max(lo, v));
  const rnd = () => Math.random() - 0.5;

  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const dow = d.getDay();

    // Fraud probability (0~1)
    const base = 0.028;
    const monthly = 0.008 * Math.sin((2 * Math.PI * i) / 28);
    const weekendLift = dow === 0 || dow === 6 ? 0.006 : 0;
    const noise = rnd() * 0.006;
    const p = clamp(base + monthly + weekendLift + noise, 0.002, 0.12);

    // Avg transaction amount
    const amtBase =
      120 + 20 * Math.sin((2 * Math.PI * i) / 14) + (dow >= 5 ? 15 : 0);
    const amtNoise = rnd() * 12;
    const amt = Math.max(60, amtBase + amtNoise);

    out.push({
      date: d.toISOString().slice(0, 10),
      isFraudMean: Math.round(p * 10000) / 10000,
      transactionAmtMean: Math.round(amt * 100) / 100,
    });
  }
  return out;
}
