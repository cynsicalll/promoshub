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

export function SettingsView() {
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
          toast.error("Die Datei enthält keine Daten");
          return;
        }
        setPendingRows(rows);
        setPendingPreview({ headers: Object.keys(rows[0]), count: rows.length });
        toast.info(`${rows.length} Zeilen erkannt – bitte Import bestätigen`);
      } catch {
        toast.error("CSV konnte nicht gelesen werden");
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
        `${res.imported} importiert, ${res.skipped} übersprungen` +
          (res.errors.length ? `, ${res.errors.length} Fehler` : "")
      );
      setPendingRows(null);
      setPendingPreview(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import fehlgeschlagen");
    }
  }

  function exportData(type: string) {
    window.open(`/api/export?type=${type}&format=csv`, "_blank");
    toast.success("Export gestartet");
  }

  async function reseed() {
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      if (!res.ok) throw new Error("Seed fehlgeschlagen");
      toast.success("Beispieldaten wurden neu geladen");
      setTimeout(() => window.location.reload(), 600);
    } catch {
      toast.error("Fehler beim Laden der Beispieldaten");
    }
  }

  async function clearAll() {
    try {
      const res = await fetch("/api/seed?mode=clear", { method: "POST" });
      if (!res.ok) throw new Error();
      toast.success("Alle Daten wurden gelöscht");
      setTimeout(() => window.location.reload(), 600);
    } catch {
      toast.error("Fehler beim Löschen");
    }
  }

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Einstellungen</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Datenverwaltung, Import/Export und Darstellung.
        </p>
      </div>

      {/* Appearance */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Darstellung</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Design</p>
            <p className="text-xs text-muted-foreground">
              Zwischen hellem und dunklem Design wechseln.
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
                <Sun className="h-4 w-4" /> Hell
              </>
            ) : (
              <>
                <Moon className="h-4 w-4" /> Dunkel
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Import */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <FileUp className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Daten importieren</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Importiere ein Google-Sheet oder eine CSV-Datei. Spalten wie „Promo",
          „Kunde", „Datum", „Betrag", „Sound" werden automatisch zugeordnet.
          Bestehende Daten werden nicht überschrieben.
        </p>

        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label>Import-Typ</Label>
            <div className="flex gap-2">
              <Button
                variant={importType === "promos" ? "default" : "outline"}
                size="sm"
                onClick={() => setImportType("promos")}
              >
                Promos
              </Button>
              <Button
                variant={importType === "payments" ? "default" : "outline"}
                size="sm"
                onClick={() => setImportType("payments")}
              >
                Zahlungen
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
            <Upload className="h-4 w-4" /> Datei auswählen
          </Button>
        </div>

        {pendingPreview && (
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-sm font-medium">
                {pendingPreview.count} Zeilen erkannt
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPendingRows(null);
                  setPendingPreview(null);
                }}
              >
                Verwerfen
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
                  <Upload className="h-4 w-4" /> Import bestätigen
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {pendingPreview.count}{" "}
                    {importType === "promos" ? "Promos" : "Zahlungen"}{" "}
                    importieren?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Die Daten werden hinzugefügt. Bestehende Einträge bleiben
                    unberührt. Kunden und Sounds werden automatisch angelegt,
                    falls sie noch nicht existieren.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmImport}>
                    Importieren
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
          <h2 className="font-semibold">Daten exportieren</h2>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            variant="outline"
            className="justify-start gap-2"
            onClick={() => exportData("promos")}
          >
            <FileSpreadsheet className="h-4 w-4" /> Alle Promos (CSV)
          </Button>
          <Button
            variant="outline"
            className="justify-start gap-2"
            onClick={() => exportData("payments")}
          >
            <FileSpreadsheet className="h-4 w-4" /> Alle Zahlungen (CSV)
          </Button>
          <Button
            variant="outline"
            className="justify-start gap-2"
            onClick={() => exportData("customers")}
          >
            <FileSpreadsheet className="h-4 w-4" /> Alle Kunden (CSV)
          </Button>
          <Button
            variant="outline"
            className="justify-start gap-2"
            onClick={() => exportData("sounds")}
          >
            <FileSpreadsheet className="h-4 w-4" /> Alle Sounds (CSV)
          </Button>
        </div>
      </Card>

      {/* Data management */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Datenverwaltung</h2>
        </div>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-medium">Beispieldaten neu laden</p>
            <p className="text-xs text-muted-foreground">
              Setzt die Datenbank auf realistische Beispiel-Promos zurück.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <RefreshCw className="h-4 w-4" /> Neu laden
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Beispieldaten laden?</AlertDialogTitle>
                <AlertDialogDescription>
                  Alle aktuellen Daten werden durch Beispieldaten ersetzt.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction onClick={reseed}>Laden</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <Separator />
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-medium text-rose-600">
              Alle Daten löschen
            </p>
            <p className="text-xs text-muted-foreground">
              Entfernt sämtliche Promos, Zahlungen, Kunden und Sounds.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              >
                <Trash2 className="h-4 w-4" /> Alles löschen
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Wirklich alle Daten löschen?</AlertDialogTitle>
                <AlertDialogDescription>
                  Diese Aktion kann nicht rückgängig gemacht werden. Es werden
                  alle Promos, Zahlungen, Kunden und Sounds unwiderruflich
                  entfernt.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction
                  onClick={clearAll}
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                >
                  Endgültig löschen
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </Card>

      <p className="text-center text-xs text-muted-foreground py-2">
        PromoHub · Daten werden lokal in einer SQLite-Datenbank gespeichert.
      </p>
    </div>
  );
}
