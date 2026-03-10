export function downloadExpensesCSV(expenses, groupName = "expenses") {
  if (!expenses || expenses.length === 0) {
    alert("No expenses to export.");
    return;
  }
  const headers = ["Title", "Amount (INR)", "Paid By", "Split Between", "Date", "Status"];
  const rows = expenses.map((e) => [
    `"${(e.title || "").replace(/"/g, '""')}"`,
    parseFloat(e.amount || 0).toFixed(2),
    `"${(e.paidBy?.name || "Unknown").replace(/"/g, '""')}"`,
    `"${(e.splitBetween || [])
      .map((s) => `${s.user?.name || "Unknown"}: ₹${parseFloat(s.amount || 0).toFixed(2)}`)
      .join("; ")}"`,
    new Date(e.createdAt || e.created_at).toLocaleDateString("en-IN"),
    e.settled ? "Settled" : "Outstanding",
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${groupName.replace(/[^a-z0-9]/gi, "_")}_expenses.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
