"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";
import {
  Download,
  Upload,
  Palette,
  FileSpreadsheet,
  Trash2,
  Moon,
  Sun,
  RefreshCw,
  FileUp,
  Database,
} from "lucide-react";
import { toast } from "sonner";
import { parseCsv } from "@/lib/csv";
import { useImport } from "@/hooks/use-data";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CustomerAccessSection } from "@/components/views/customer-access-section";
import { useI18n } from "@/components/language-provider";
import { LANGS } from "@/lib/i18n";

export function SettingsView() {
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();
  const importMut = useImport();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [importType, setImportType] = React.useState<"promos" | "payments">(
    "promos"
  );
  const [pendingRows, setPendingRows] = React.useState<
    Record<string, string>[] | null
  >(null);
  const [pendingPreview, setPendingPreview] = React.useState<{
    headers: string[];
    count: number;
  } | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const rows = parseCsv(String(reader.result));
        if (rows.length === 0) {
          toast.error(t("settings.toast.noData"));
          return;
        }
        setPendingRows(rows);
        setPendingPreview({ headers: Object.keys(rows[0]), count: rows.length });
        toast.info(t("settings.toast.rowsDetected", { count: rows.length }));
      } catch {
        toast.error(t("settings.toast.csvReadFailed"));
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  async function confirmImport() {
    if (!pendingRows) return;
    setConfirmOpen(false);
    try {
      const res = await importMut.mutateAsync({
        rows: pendingRows,
        type: importType,
      });
      toast.success(
        t("settings.toast.importResult", {
          imported: res.imported,
          skipped: res.skipped,
        }) +
          (res.errors.length
            ? t("settings.toast.importErrors", { count: res.errors.length })
            : "")
      );
      setPendingRows(null);
      setPendingPreview(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("settings.toast.importFailed"));
    }
  }

  function exportData(type: string) {
    window.open(`/api/export?type=${type}&format=csv`, "_blank");
    toast.success(t("settings.exportStarted"));
  }

  function backupAll() {
    window.open(`/api/backup`, "_blank");
    toast.success(t("settings.backupStarted"));
  }

  async function reseed() {
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      if (!res.ok) throw new Error("Seed fehlgeschlagen");
      toast.success(t("settings.toast.sampleReloaded"));
      setTimeout(() => window.location.reload(), 600);
    } catch {
      toast.error(t("settings.toast.sampleReloadFailed"));
    }
  }

  async function clearAll() {
    try {
      const res = await fetch("/api/seed?mode=clear", { method: "POST" });
      if (!res.ok) throw new Error();
      toast.success(t("settings.toast.allDeleted"));
      setTimeout(() => window.location.reload(), 600);
    } catch {
      toast.error(t("settings.toast.deleteFailed"));
    }
  }

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("settings.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("settings.subtitle")}
        </p>
      </div>

      {/* Appearance */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">{t("settings.appearance")}</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{t("settings.theme")}</p>
            <p className="text-xs text-muted-foreground">
              {t("settings.themeDesc")}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="gap-2"
          >
            {theme === "dark" ? (
              <>
                <Sun className="h-4 w-4" /> {t("settings.light")}
              </>
            ) : (
              <>
                <Moon className="h-4 w-4" /> {t("settings.dark")}
              </>
            )}
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{t("settings.language")}</p>
            <p className="text-xs text-muted-foreground">
              {t("settings.languageDesc")}
            </p>
          </div>
          <LanguageSwitcher />
        </div>
      </Card>

      {/* Customer Access Management */}
      <CustomerAccessSection />

      {/* Import */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <FileUp className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">{t("settings.import")}</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("settings.importDesc")}
        </p>

        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label>{t("settings.importType")}</Label>
            <div className="flex gap-2">
              <Button
                variant={importType === "promos" ? "default" : "outline"}
                size="sm"
                onClick={() => setImportType("promos")}
              >
                {t("settings.importPromos")}
              </Button>
              <Button
                variant={importType === "payments" ? "default" : "outline"}
                size="sm"
                onClick={() => setImportType("payments")}
              >
                {t("settings.importPayments")}
              </Button>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.tsv,.txt"
            onChange={handleFile}
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-4 w-4" /> {t("settings.importSelectFile")}
          </Button>
        </div>

        {pendingPreview && (
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-sm font-medium">
                {t("settings.importRowsDetected", { count: pendingPreview.count })}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPendingRows(null);
                  setPendingPreview(null);
                }}
              >
                {t("settings.importDiscard")}
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {pendingPreview.headers.map((h) => (
                <Badge key={h} variant="secondary" className="text-xs">
                  {h}
                </Badge>
              ))}
            </div>
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <AlertDialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Upload className="h-4 w-4" /> {t("settings.importConfirm")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t("settings.importConfirmTitle", {
                      count: pendingPreview.count,
                      type: importType === "promos"
                        ? t("settings.importPromos")
                        : t("settings.importPayments"),
                    })}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("settings.importConfirmDesc")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("action.cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmImport}>
                    {t("settings.import")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </Card>

      {/* Export */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Download className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">{t("settings.export")}</h2>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            variant="outline"
            className="justify-start gap-2"
            onClick={() => exportData("promos")}
          >
            <FileSpreadsheet className="h-4 w-4" /> {t("settings.exportPromos")}
          </Button>
          <Button
            variant="outline"
            className="justify-start gap-2"
            onClick={() => exportData("payments")}
          >
            <FileSpreadsheet className="h-4 w-4" /> {t("settings.exportPayments")}
          </Button>
          <Button
            variant="outline"
            className="justify-start gap-2"
            onClick={() => exportData("customers")}
          >
            <FileSpreadsheet className="h-4 w-4" /> {t("settings.exportCustomers")}
          </Button>
          <Button
            variant="outline"
            className="justify-start gap-2"
            onClick={() => exportData("sounds")}
          >
            <FileSpreadsheet className="h-4 w-4" /> {t("settings.exportSounds")}
          </Button>
        </div>
      </Card>

      {/* Full Backup */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">{t("settings.backup")}</h2>
        </div>
        <p className="text-sm text-muted-foreground">{t("settings.backupDesc")}</p>
        <Button
          className="w-full gap-2"
          onClick={backupAll}
        >
          <Download className="h-4 w-4" /> {t("settings.backupDownload")}
        </Button>
      </Card>

      {/* Data management */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">{t("settings.dataManagement")}</h2>
        </div>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-medium">{t("settings.reloadSample")}</p>
            <p className="text-xs text-muted-foreground">
              {t("settings.reloadSampleDesc")}
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <RefreshCw className="h-4 w-4" /> {t("action.save")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("settings.reloadTitle")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("settings.reloadDesc")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("action.cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={reseed}>{t("settings.reloadAction")}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <Separator />
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-medium text-rose-600">
              {t("settings.clearAll")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("settings.clearAllDesc")}
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              >
                <Trash2 className="h-4 w-4" /> {t("settings.clearAll")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("settings.clearAllTitle")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("settings.clearAllDesc2")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("action.cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={clearAll}
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                >
                  {t("settings.deletePermanently")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </Card>

      <p className="text-center text-xs text-muted-foreground py-2">
        {t("settings.dataStoredLocally")}
      </p>
    </div>
  );
}

function LanguageSwitcher() {
  const { lang, setLang } = useI18n();
  const current = LANGS.find((l) => l.value === lang) || LANGS[0];
  const next = LANGS.find((l) => l.value !== lang) || LANGS[0];
  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={() => setLang(next.value)}
    >
      <span className="text-base leading-none">{current.flag}</span>
      {current.label}
    </Button>
  );
}
