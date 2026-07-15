// Pure, unit-testable port of the prototype's amortisation + investing-the-
// difference maths (Finance App.dc.html renderVals()). No I/O - safe to call
// on every slider drag without a network round-trip.

function simulate(balance: number, monthlyRate: number, payment: number) {
  let months = 0;
  let totalInterest = 0;
  let bal = balance;
  while (bal > 0 && months < 600) {
    const interest = bal * monthlyRate;
    const principal = payment - interest;
    if (principal <= 0) {
      months = 600;
      break;
    }
    totalInterest += interest;
    bal -= principal;
    months++;
  }
  return { months, totalInterest, endBalance: Math.max(bal, 0) };
}

export type MortgageVsInvestInput = {
  balance: number;
  annualRate: number;
  payment: number;
  extraPayment: number;
  assumedMarketReturn: number;
};

export type MortgageVsInvestResult = {
  payoffMonths: number;
  monthsSaved: number;
  interestSaved: number;
  investFutureValue: number;
  investGrowth: number;
  leanTowardInvest: boolean;
};

export function computeMortgageVsInvest(input: MortgageVsInvestInput): MortgageVsInvestResult {
  const monthlyRate = input.annualRate / 12;
  const baseline = simulate(input.balance, monthlyRate, input.payment);
  const withExtra = simulate(input.balance, monthlyRate, input.payment + input.extraPayment);

  const interestSaved = Math.max(0, baseline.totalInterest - withExtra.totalInterest);
  const monthsSaved = Math.max(0, baseline.months - withExtra.months);

  const marketMonthlyRate = input.assumedMarketReturn / 12;
  const n = withExtra.months;
  const investFutureValue =
    input.extraPayment > 0 && n > 0
      ? input.extraPayment * ((Math.pow(1 + marketMonthlyRate, n) - 1) / marketMonthlyRate)
      : 0;
  const investContributed = input.extraPayment * n;
  const investGrowth = Math.max(0, investFutureValue - investContributed);

  return {
    payoffMonths: withExtra.months,
    monthsSaved,
    interestSaved,
    investFutureValue,
    investGrowth,
    leanTowardInvest: input.annualRate < input.assumedMarketReturn,
  };
}

export function monthsToYearsMonths(totalMonths: number): { years: number; months: number } {
  return { years: Math.floor(totalMonths / 12), months: totalMonths % 12 };
}
