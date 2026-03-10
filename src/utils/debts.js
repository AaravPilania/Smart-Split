/**
 * Simplify debts using a greedy two-pointer algorithm.
 * balances: array of { user: { id, name }, balance: number }
 *   Positive balance = others owe this person.
 *   Negative balance = this person owes others.
 * Returns: array of { from: user, to: user, amount: number }
 */
export function simplifyDebts(balances) {
  const givers = []; // people owed money (positive balance)
  const takers = []; // people who owe money (negative balance)

  balances.forEach((b) => {
    const amt = parseFloat(b.balance || 0);
    const user = b.user || b;
    if (amt > 0.01)  givers.push({ user, amount: amt });
    else if (amt < -0.01) takers.push({ user, amount: Math.abs(amt) });
  });

  givers.sort((a, b) => b.amount - a.amount);
  takers.sort((a, b) => b.amount - a.amount);

  const transactions = [];
  let gi = 0, ti = 0;

  while (gi < givers.length && ti < takers.length) {
    const give = givers[gi];
    const take = takers[ti];
    const amount = Math.min(give.amount, take.amount);
    if (amount > 0.01) {
      transactions.push({
        from: take.user,
        to: give.user,
        amount: Math.round(amount * 100) / 100,
      });
    }
    give.amount -= amount;
    take.amount -= amount;
    if (give.amount < 0.01) gi++;
    if (take.amount < 0.01) ti++;
  }
  return transactions;
}
