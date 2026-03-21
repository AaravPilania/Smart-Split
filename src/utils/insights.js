/**
 * computeInsights — derives up to 4 actionable spending insights
 * from data that Dashboard already has in state (no extra fetches).
 *
 * @param {object} params
 * @param {Array}  params.expenses       – all fetched expenses (may be large)
 * @param {Array}  params.groups         – user's groups
 * @param {Array}  params.settlements    – outstanding settlement objects {from, to, amount, groupName?}
 * @param {Array}  params.categoryData   – [{key, label, icon, amount, badge}] sorted desc
 * @param {Array}  params.monthlyData    – [{label, amount, userShare, isCurrent}] — 6 entries
 * @param {string} params.currentUserId
 * @returns {Array<{icon,title,text,type,good?}>}
 */
export function computeInsights({
  expenses = [],
  groups = [],
  settlements = [],
  categoryData = [],
  monthlyData = [],
  currentUserId = '',
}) {
  const insights = [];

  // ─── 1. Top spend category ───────────────────────────────────────────────
  if (categoryData.length > 0) {
    const top = categoryData[0];
    const total = categoryData.reduce((s, c) => s + c.amount, 0);
    const pct = total > 0 ? Math.round((top.amount / total) * 100) : 0;
    insights.push({
      icon: top.icon || '🏷️',
      title: `Top spend: ${top.label}`,
      text: `${pct}% of all your expenses (₹${Math.round(top.amount).toLocaleString('en-IN')})`,
      type: 'category',
    });
  }

  // ─── 2. Monthly spending trend ───────────────────────────────────────────
  if (monthlyData.length >= 2) {
    const curr = monthlyData[monthlyData.length - 1];
    const prev = monthlyData[monthlyData.length - 2];
    if (prev.amount > 0 && curr.amount >= 0) {
      const changePct = Math.abs(((curr.amount - prev.amount) / prev.amount) * 100).toFixed(0);
      const up = curr.amount > prev.amount;
      insights.push({
        icon: up ? '📈' : '📉',
        title: up
          ? `↑ Spending up ${changePct}% this month`
          : `↓ Spending down ${changePct}% this month`,
        text: `vs ${prev.label}: ₹${Math.round(prev.amount).toLocaleString('en-IN')} → ₹${Math.round(curr.amount).toLocaleString('en-IN')}`,
        type: 'trend',
        good: !up,
      });
    }
  }

  // ─── 3. Most shared with (from expense splits) ───────────────────────────
  if (expenses.length > 0) {
    const nameCounts = {};
    expenses.forEach((exp) => {
      (exp.splitBetween || []).forEach((split) => {
        const uid =
          split.user?.id?.toString() ||
          split.user?._id?.toString() ||
          String(split.user || '');
        if (uid && uid !== currentUserId && split.user?.name) {
          nameCounts[split.user.name] = (nameCounts[split.user.name] || 0) + 1;
        }
      });
    });
    const sorted = Object.entries(nameCounts).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0) {
      insights.push({
        icon: '👥',
        title: `Most shared with ${sorted[0][0]}`,
        text: `${sorted[0][1]} shared expense${sorted[0][1] !== 1 ? 's' : ''} together`,
        type: 'social',
      });
    }
  }

  // ─── 4. Quick win settlement or "you're owed" ────────────────────────────
  const youOwe = settlements.filter(
    (s) =>
      String(s.from?.id || s.from) === String(currentUserId) ||
      String(s.from?.id || s.from?._id) === String(currentUserId)
  );
  const owedToYou = settlements.filter(
    (s) =>
      String(s.to?.id || s.to) === String(currentUserId) ||
      String(s.to?.id || s.to?._id) === String(currentUserId)
  );

  if (youOwe.length > 0) {
    const smallest = [...youOwe].sort((a, b) => a.amount - b.amount)[0];
    insights.push({
      icon: '⚡',
      title: `Quick clear: ₹${parseFloat(smallest.amount).toFixed(0)} to ${smallest.to?.name || 'someone'}`,
      text: smallest.groupName
        ? `Settling this clears your balance in "${smallest.groupName}"`
        : 'One payment to clear this debt',
      type: 'action',
    });
  } else if (owedToYou.length > 0) {
    const total = owedToYou.reduce((s, x) => s + parseFloat(x.amount || 0), 0);
    insights.push({
      icon: '💰',
      title: `₹${total.toFixed(0)} owed to you`,
      text: `From ${owedToYou.length} pending payment${owedToYou.length !== 1 ? 's' : ''}`,
      type: 'income',
      good: true,
    });
  }

  return insights.slice(0, 4);
}
