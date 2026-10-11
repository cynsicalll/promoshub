"use client";

import * as React from "react";
import { useMonthly } from "@/hooks/use-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ComposedChart,
  Line,
} from "recharts";
import { formatCurrency } from "@/lib/format";
import { StatCard } from "@/components/stat-card";
import { useI18n } from "@/components/language-provider";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Megaphone,
  Video,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Bell,
} from "lucide-react";
import { toast } from "sonner";

export function MonthlyView() {
  const { t } = useI18n();
  const now = new Date();
  const [year, setYear] = React.useState<number>(now.getFullYear());
  const { data, isLoading } = useMonthly(year);

  const entries = data?.entries || [];
  const years = data?.years || [now.getFullYear()];

  const yearTotals = React.useMemo(() => {
    return entries.reduce(
      (acc, e) => {
        acc.earned += e.earned;
        acc.received += e.received;
        acc.outstanding += e.outstanding;
        acc.promos += e.promos;
        acc.tiktoks += e.tiktoks;
        return acc;
      },
      { earned: 0, received: 0, outstanding: 0, promos: 0, tiktoks: 0 }
    );
  }, [entries]);

  const chartData = entries.map((e) => ({
    label: e.label,
    [t("monthly.col.earnings")]: e.earned,
    [t("monthly.col.received")]: e.received,
    [t("monthly.col.open")]: e.outstanding,
    [t("monthly.col.promos")]: e.promos,
    [t("monthly.col.tiktoks")]: e.tiktoks,
  }));

  function changeYear(delta: number) {
    setYear((y) => y + delta);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <CalendarRange className="h-6 w-6 text-muted-foreground" />
            {t("monthly.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("monthly.subtitle", { year })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => changeYear(-1)}
            aria-label={t("monthly.prevYear")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => changeYear(1)}
            aria-label={t("monthly.nextYear")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            onClick={async () => {
              try {
                const yearTotal = monthlyData.reduce((s, m) => s + (m.earned || 0), 0);
                const yearReceived = monthlyData.reduce((s, m) => s + (m.received || 0), 0);
                const yearOutstanding = yearTotal - yearReceived;
                const promoCount = monthlyData.reduce((s, m) => s + (m.promos || 0), 0);
                const res = await fetch("/api/push/send", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    type: "monthly",
                    data: {
                      month: String(year),
                      earnings: yearTotal.toFixed(2),
                      received: yearReceived.toFixed(2),
                      outstanding: yearOutstanding.toFixed(2),
                      promoCount,
                    },
                  }),
                });
                if (!res.ok) throw new Error("Failed");
                const result = await res.json();
                if (result.sent > 0) {
                  toast.success(`Monthly summary sent: "${result.title}"`);
                } else {
                  toast.error("Viewer hasn't enabled notifications yet.");
                }
              } catch {
                toast.error("Failed to send notification");
              }
            }}
          >
            <Bell className="h-4 w-4" /> Send Summary
          </Button>
        </div>
      </div>

      {/* Year KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("monthly.totalEarnings", { year })}
          value={formatCurrency(yearTotals.earned)}
          icon={Wallet}
        />
        <StatCard
          label={t("monthly.received")}
          value={formatCurrency(yearTotals.received)}
          icon={TrendingUp}
          tone="emerald"
        />
        <StatCard
          label={t("monthly.open")}
          value={formatCurrency(yearTotals.outstanding)}
          icon={TrendingDown}
          tone={yearTotals.outstanding > 0 ? "amber" : "default"}
        />
        <StatCard
          label={t("monthly.promosTiktoks")}
          value={`${yearTotals.promos} / ${yearTotals.tiktoks}`}
          hint={t("monthly.promosHint", {
            promos: yearTotals.promos,
            tiktoks: yearTotals.tiktoks,
          })}
          icon={Video}
          tone="teal"
        />
      </div>

      {/* Monthly Income Summary — current month breakdown */}
      {(() => {
        const now = new Date();
        const currentMonthIdx = now.getMonth();
        const currentMonth = entries[currentMonthIdx];
        const lastMonth = entries[currentMonthIdx - 1] || null;
        if (!currentMonth || (currentMonth.earned === 0 && currentMonth.promos === 0)) return null;

        const earnedChange = lastMonth && lastMonth.earned > 0
          ? Math.round(((currentMonth.earned - lastMonth.earned) / lastMonth.earned) * 100)
          : null;
        const receivedChange = lastMonth && lastMonth.received > 0
          ? Math.round(((currentMonth.received - lastMonth.received) / lastMonth.received) * 100)
          : null;

        return (
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-emerald-500" />
                  {t("monthly.incomeSummary")}
                </h3>
                <p className="text-xs text-muted-foreground">{currentMonth.label} {year}</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {/* Earned this month */}
              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="text-[11px] text-muted-foreground uppercase">{t("monthly.col.earnings")}</p>
                <p className="text-xl font-bold tabular-nums">{formatCurrency(currentMonth.earned)}</p>
                {earnedChange !== null && (
                  <p className={`text-[10px] flex items-center gap-0.5 ${earnedChange >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {earnedChange >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                    {earnedChange >= 0 ? "+" : ""}{earnedChange}% vs last month
                  </p>
                )}
              </div>
              {/* Received this month */}
              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="text-[11px] text-muted-foreground uppercase">{t("monthly.col.received")}</p>
                <p className="text-xl font-bold tabular-nums text-emerald-600">{formatCurrency(currentMonth.received)}</p>
                {receivedChange !== null && (
                  <p className={`text-[10px] flex items-center gap-0.5 ${receivedChange >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {receivedChange >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                    {receivedChange >= 0 ? "+" : ""}{receivedChange}% vs last month
                  </p>
                )}
              </div>
              {/* Outstanding this month */}
              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="text-[11px] text-muted-foreground uppercase">{t("monthly.col.open")}</p>
                <p className="text-xl font-bold tabular-nums text-amber-600">{formatCurrency(currentMonth.outstanding)}</p>
                <p className="text-[10px] text-muted-foreground">{currentMonth.promos} promo(s)</p>
              </div>
              {/* Avg per promo */}
              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="text-[11px] text-muted-foreground uppercase">{t("monthly.avgPerPromo")}</p>
                <p className="text-xl font-bold tabular-nums">
                  {currentMonth.promos > 0 ? formatCurrency(Math.round(currentMonth.earned / currentMonth.promos)) : "—"}
                </p>
                <p className="text-[10px] text-muted-foreground">{currentMonth.tiktoks} TikTok(s)</p>
              </div>
            </div>
          </Card>
        );
      })()}

      {/* Main chart: Verdienst/Erhalten/Offen bars */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">{t("monthly.cashFlow")}</h3>
            <p className="text-xs text-muted-foreground">
              {t("monthly.cashFlowSubtitle")}
            </p>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                className="fill-muted-foreground"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={11}
                className="fill-muted-foreground"
                width={48}
                tickFormatter={(v) => `${v}€`}
              />
              <Tooltip
                formatter={(v: number) => formatCurrency(v)}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey={t("monthly.col.earnings")} fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey={t("monthly.col.received")} fill="#0d9488" radius={[4, 4, 0, 0]} />
              <Bar dataKey={t("monthly.col.open")} fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Secondary chart: Promos & TikToks as composed */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">{t("monthly.activity")}</h3>
            <p className="text-xs text-muted-foreground">
              {t("monthly.activitySubtitle")}
            </p>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                className="fill-muted-foreground"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={11}
                className="fill-muted-foreground"
                width={32}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey={t("monthly.col.promos")} fill="#6366f1" radius={[4, 4, 0, 0]} barSize={18} />
              <Bar dataKey={t("monthly.col.tiktoks")} fill="#ec4899" radius={[4, 4, 0, 0]} barSize={18} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Monthly table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-[110px]">{t("monthly.col.month")}</TableHead>
                <TableHead className="text-center w-[80px]">{t("monthly.col.promos")}</TableHead>
                <TableHead className="text-center w-[90px]">{t("monthly.col.tiktoks")}</TableHead>
                <TableHead className="text-right w-[130px]">{t("monthly.col.earnings")}</TableHead>
                <TableHead className="text-right w-[130px]">{t("monthly.col.received")}</TableHead>
                <TableHead className="text-right w-[130px]">{t("monthly.col.open")}</TableHead>
                <TableHead className="w-[160px]">{t("monthly.col.distribution")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    {t("action.loading")}
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((e) => {
                  const maxEarned = Math.max(...entries.map((x) => x.earned), 1);
                  const pct = Math.min(100, (e.earned / maxEarned) * 100);
                  return (
                    <TableRow key={e.key} className="hover:bg-muted/40">
                      <TableCell className="font-medium">{e.label}</TableCell>
                      <TableCell className="text-center tabular-nums">
                        {e.promos > 0 ? e.promos : "—"}
                      </TableCell>
                      <TableCell className="text-center tabular-nums">
                        {e.tiktoks > 0 ? e.tiktoks : "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {e.earned > 0 ? formatCurrency(e.earned) : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                        {e.received > 0 ? formatCurrency(e.received) : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {e.outstanding > 0 ? (
                          <span className="text-amber-600 dark:text-amber-400">
                            {formatCurrency(e.outstanding)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        {e.earned > 0 ? (
                          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
              {/* Total row */}
              <TableRow className="bg-muted/30 font-semibold border-t-2">
                <TableCell>{t("monthly.sum", { year })}</TableCell>
                <TableCell className="text-center tabular-nums">
                  {yearTotals.promos}
                </TableCell>
                <TableCell className="text-center tabular-nums">
                  {yearTotals.tiktoks}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(yearTotals.earned)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(yearTotals.received)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-amber-600 dark:text-amber-400">
                  {formatCurrency(yearTotals.outstanding)}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {yearTotals.promos} {t("monthly.col.promos")}
                  </Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
