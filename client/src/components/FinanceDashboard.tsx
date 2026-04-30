import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, LineChart, Line, CartesianGrid
} from "recharts";
import { getMonthlySummary, getCategorySpending, getTransactions } from "../financeAPI";
import type { FinanceMonthlySummary, FinanceCategorySpending, FinanceTransaction } from "../types";
import "./FinanceDashboard.css";

interface Props { currentMonth: string; }

export default function FinanceDashboard({ currentMonth }: Props) {
  const [summary, setSummary] = useState<FinanceMonthlySummary | null>(null);
  const [spending, setSpending] = useState<FinanceCategorySpending[]>([]);
  const [recentTx, setRecentTx] = useState<FinanceTransaction[]>([]);

  useEffect(() => {
    getMonthlySummary(currentMonth).then(setSummary);
    getCategorySpending(currentMonth).then(setSpending);
    getTransactions(currentMonth).then(data => setRecentTx(data.slice(0, 5)));
  }, [currentMonth]);

  const fmt = (n: number) => `€${Number(n).toFixed(2)}`;
  const totalBudget = spending.reduce((a, c) => a + Number(c.monthly_budget), 0);
  const overBudgetCount = spending.filter(c => Number(c.spent) > Number(c.monthly_budget) && Number(c.monthly_budget) > 0).length;

  const pieData = spending
    .filter(c => Number(c.spent) > 0)
    .map(c => ({ name: `${c.icon} ${c.name}`, value: Number(c.spent), color: c.color }));

  const barData = spending
    .filter(c => Number(c.monthly_budget) > 0)
    .map(c => ({
      name: `${c.icon} ${c.name}`,
      spent: Number(c.spent),
      budget: Number(c.monthly_budget),
      over: Number(c.spent) > Number(c.monthly_budget),
      color: c.color,
    }));

  return (
    <div className="finance-dashboard">
      {/* Summary strip */}
      <div className="finance-summary-strip">
        <div className="finance-stat-card">
          <span className="finance-stat-label">Carried In</span>
          <span className={`finance-stat-value ${summary && summary.opening_balance < 0 ? "negative" : "positive"}`}>
            {summary ? fmt(summary.opening_balance) : "—"}
          </span>
        </div>
        <div className="finance-stat-card">
          <span className="finance-stat-label">Income</span>
          <span className="finance-stat-value positive">{summary ? fmt(summary.total_income) : "—"}</span>
        </div>
        <div className="finance-stat-card">
          <span className="finance-stat-label">Spent</span>
          <span className="finance-stat-value negative">{summary ? fmt(summary.total_expenses) : "—"}</span>
        </div>
        <div className="finance-stat-card highlight">
          <span className="finance-stat-label">Balance</span>
          <span className={`finance-stat-value ${summary && summary.closing_balance < 0 ? "negative" : "positive"}`}>
            {summary ? fmt(summary.closing_balance) : "—"}
          </span>
        </div>
        {overBudgetCount > 0 && (
          <div className="finance-stat-card warning">
            <span className="finance-stat-label">Over Budget</span>
            <span className="finance-stat-value">{overBudgetCount} categor{overBudgetCount > 1 ? "ies" : "y"}</span>
          </div>
        )}
      </div>

      <div className="finance-charts-grid">
        {/* Bar chart — spent vs budget */}
        {barData.length > 0 && (
          <div className="finance-chart-card wide">
            <h3>Spent vs Budget</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={barData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `€${v}`} />
                <Tooltip formatter={(v: any) => `€${Number(v).toFixed(2)}`} />
                <Bar dataKey="budget" name="Budget" fill="#e5e7eb" radius={[4,4,0,0]} />
                <Bar dataKey="spent" name="Spent" radius={[4,4,0,0]}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={entry.over ? "#ef4444" : entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Donut chart */}
        {pieData.length > 0 && (
          <div className="finance-chart-card">
            <h3>Spending Breakdown</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => `€${Number(v).toFixed(2)}`} />
                <Legend iconType="circle" iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recent transactions */}
      {recentTx.length > 0 && (
        <div className="finance-chart-card">
          <h3>Recent Transactions</h3>
          <div className="finance-recent-list">
            {recentTx.map(tx => (
              <div key={tx.id} className="finance-recent-item">
                <span className="finance-recent-icon">{tx.category_icon || "💰"}</span>
                <div className="finance-recent-info">
                  <span className="finance-recent-note">{tx.note || tx.category_name || "—"}</span>
                  <span className="finance-recent-date">{tx.date}</span>
                </div>
                <span className={`finance-recent-amount ${tx.type === "income" ? "positive" : "negative"}`}>
                  {tx.type === "income" ? "+" : "-"}{fmt(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {spending.length === 0 && !summary?.total_income && (
        <div className="finance-empty-state">
          <p>🏦 No data yet for this month.</p>
          <p>Add your income and expenses in Transactions, and set up budgets in Budget.</p>
        </div>
      )}
    </div>
  );
}