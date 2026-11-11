"use client";

import { useState, useTransition } from "react";
import {
  QrCode,
  Barcode,
  School,
  Building2,
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Layers,
  Flame,
  Activity,
  ArrowUpDown,
  Filter,
  Check,
  Zap,
  Clock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarcodeExportButton,
  QrExportButton,
  BulkQrSheetButton
} from "@/components/shared/code-export";
import {
  createQuickProductBarcode,
  deleteProductBarcode,
  recordCodeScanAction
} from "./barcode-actions";

type ProductBarcodeItem = {
  id: string;
  name: string;
  barcode: string;
  price?: number | null;
  package_size?: string | null;
  category?: string | null;
  mission_id?: string | null;
  mission_title?: string | null;
  mission_product_id?: string | null;
  usage_count?: number;
  last_used_at?: string | null;
};

type MissionQrItem = {
  id: string;
  title: string;
  number: number;
  version: number;
  status: string;
  minutes: number;
  usage_count?: number;
  last_used_at?: string | null;
};

type StudentQrItem = {
  id: string;
  name: string;
  room: string;
  grade: number;
  active: boolean;
  usage_count?: number;
  last_used_at?: string | null;
};

type StoreQrItem = {
  id: string;
  name: string;
  active: boolean;
  usage_count?: number;
  last_used_at?: string | null;
};

function formatRelativeTime(dateString?: string | null) {
  if (!dateString) return "Never used";
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch (_) {
    return "Recently";
  }
}

export function QrBarcodeManagementView({
  role,
  products,
  missions,
  students,
  stores
}: {
  role: "admin" | "teacher" | "store";
  products: ProductBarcodeItem[];
  missions: MissionQrItem[];
  students: StudentQrItem[];
  stores: StoreQrItem[];
}) {
  const [activeTab, setActiveTab] = useState<"all" | "products" | "missions" | "students" | "stores">("all");
  const [search, setSearch] = useState("");
  const [usageFilter, setUsageFilter] = useState<"all" | "used" | "unused">("all");
  const [sortBy, setSortBy] = useState<"most_used" | "recent" | "alpha" | "default">("most_used");
  const [showAddModal, setShowAddModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [scanningCodeId, setScanningCodeId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Calculate high-level usage totals
  const totalProductScans = products.reduce((acc, p) => acc + (p.usage_count || 0), 0);
  const totalMissionLaunches = missions.reduce((acc, m) => acc + (m.usage_count || 0), 0);
  const totalStudentLogins = students.reduce((acc, s) => acc + (s.usage_count || 0), 0);
  const totalStoreCheckins = stores.reduce((acc, st) => acc + (st.usage_count || 0), 0);
  const grandTotalScans = totalProductScans + totalMissionLaunches + totalStudentLogins + totalStoreCheckins;

  const scannedProductsCount = products.filter((p) => (p.usage_count || 0) > 0).length;

  // Search filter
  const q = search.trim().toLowerCase();

  const applyFilters = <T extends { usage_count?: number; last_used_at?: string | null; name?: string; title?: string }>(
    items: T[],
    textMatch: (item: T) => boolean
  ): T[] => {
    let result = items.filter((item) => {
      if (q && !textMatch(item)) return false;
      const count = item.usage_count || 0;
      if (usageFilter === "used" && count === 0) return false;
      if (usageFilter === "unused" && count > 0) return false;
      return true;
    });

    if (sortBy === "most_used") {
      result.sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0));
    } else if (sortBy === "recent") {
      result.sort((a, b) => {
        const timeA = a.last_used_at ? new Date(a.last_used_at).getTime() : 0;
        const timeB = b.last_used_at ? new Date(b.last_used_at).getTime() : 0;
        return timeB - timeA;
      });
    } else if (sortBy === "alpha") {
      result.sort((a, b) => {
        const nameA = (a.name || a.title || "").toLowerCase();
        const nameB = (b.name || b.title || "").toLowerCase();
        return nameA.localeCompare(nameB);
      });
    }

    return result;
  };

  const filteredProducts = applyFilters(products, (p) =>
    p.name.toLowerCase().includes(q) || p.barcode.toLowerCase().includes(q)
  );

  const filteredMissions = applyFilters(missions, (m) =>
    m.title.toLowerCase().includes(q) || `mission ${m.number}`.includes(q)
  );

  const filteredStudents = applyFilters(students, (s) =>
    s.name.toLowerCase().includes(q) || s.room.toLowerCase().includes(q)
  );

  const filteredStores = applyFilters(stores, (st) =>
    st.name.toLowerCase().includes(q)
  );

  const totalCount =
    filteredProducts.length + filteredMissions.length + filteredStudents.length + filteredStores.length;

  const handleTestScan = (codeType: "product" | "mission" | "student" | "store", codeId: string, label: string) => {
    setScanningCodeId(codeId);
    setToast(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("codeType", codeType);
      fd.append("codeId", codeId);
      fd.append("codeLabel", label);

      const res = await recordCodeScanAction(fd);
      setScanningCodeId(null);
      if (res?.error) {
        setToast({ type: "error", message: res.error });
      } else {
        setToast({
          type: "success",
          message: `Recorded test scan for "${label}"! Usage counter incremented.`
        });
      }
    });
  };

  const handleDeleteBarcode = (barcode: string, missionProductId?: string | null, productId?: string | null, name?: string) => {
    if (!confirm(`Are you sure you want to delete the barcode for "${name || barcode}"?`)) {
      return;
    }
    setToast(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("barcode", barcode);
      if (missionProductId) fd.append("missionProductId", missionProductId);
      if (productId) fd.append("productId", productId);

      const res = await deleteProductBarcode(fd);
      if (res?.error) {
        setToast({ type: "error", message: res.error });
      } else {
        setToast({ type: "success", message: `Deleted barcode "${barcode}" successfully.` });
      }
    });
  };

  return (
    <main className="page-shell space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-teal-50 text-teal-700 shadow-2xs">
            <Barcode className="h-6 w-6" />
          </div>
          <div>
            <p className="eyebrow capitalize">{role} portal</p>
            <h1 className="mt-0.5 text-3xl font-black text-navy">QR & Barcode Center</h1>
            <p className="mt-1 text-sm text-muted">
              Live scannable labels, real-time usage telemetry counters, and lifecycle management for student cards, mission QRs, and product barcodes.
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {filteredMissions.length > 0 && (
            <BulkQrSheetButton
              type="mission"
              label="Bulk Mission QRs (PDF)"
              targets={filteredMissions.map((m) => ({
                id: m.id,
                label: m.title,
                subtitle: `Mission QR · v${m.version}`
              }))}
            />
          )}
          {role !== "store" && filteredStudents.length > 0 && (
            <BulkQrSheetButton
              type="student"
              label="Student QR Cards (PDF)"
              targets={filteredStudents.map((s) => ({
                id: s.id,
                label: s.name,
                subtitle: `${s.room} · Grade ${s.grade}`
              }))}
            />
          )}
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-navy font-bold text-white hover:bg-navy/90 shadow-2xs"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Add Product Barcode
          </Button>
        </div>
      </div>

      {/* 2. LIVE USAGE COUNTERS OVERVIEW BANNER */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Grand Total Scans */}
        <div className="panel p-4 bg-gradient-to-br from-slate-900 to-navy text-white col-span-2 sm:col-span-1 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-teal-300">
              Total System Scans
            </span>
            <Activity className="h-4 w-4 text-teal-400" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <p className="text-3xl font-black text-white">{grandTotalScans}</p>
            <span className="text-xs font-bold text-slate-300">all codes</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-300 flex items-center gap-1">
            <Flame className="h-3 w-3 text-amber-400" /> Live usage tracked
          </p>
        </div>

        {/* Card 2: Product Barcode Scans */}
        <div className="panel p-4 bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted uppercase">Product Barcodes</span>
            <Barcode className="h-4 w-4 text-teal-600" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <p className="text-3xl font-black text-navy">{totalProductScans}</p>
            <span className="text-xs font-bold text-muted">scans</span>
          </div>
          <p className="mt-1 text-[11px] font-semibold text-emerald-700">
            {scannedProductsCount} of {products.length} active in field
          </p>
        </div>

        {/* Card 3: Mission QR Launches */}
        <div className="panel p-4 bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted uppercase">Mission Launches</span>
            <QrCode className="h-4 w-4 text-brand" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <p className="text-3xl font-black text-navy">{totalMissionLaunches}</p>
            <span className="text-xs font-bold text-muted">launches</span>
          </div>
          <p className="mt-1 text-[11px] font-semibold text-brand">
            Across {missions.length} learning missions
          </p>
        </div>

        {/* Card 4: Student QR Logins */}
        <div className="panel p-4 bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted uppercase">Student Logins</span>
            <School className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <p className="text-3xl font-black text-navy">{totalStudentLogins}</p>
            <span className="text-xs font-bold text-muted">card logins</span>
          </div>
          <p className="mt-1 text-[11px] font-semibold text-purple-700">
            {students.length} issued student cards
          </p>
        </div>

        {/* Card 5: Store Check-in Scans */}
        <div className="panel p-4 bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted uppercase">Store Check-ins</span>
            <Building2 className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <p className="text-3xl font-black text-navy">{totalStoreCheckins}</p>
            <span className="text-xs font-bold text-muted">arrivals</span>
          </div>
          <p className="mt-1 text-[11px] font-semibold text-amber-700">
            Across {stores.length} store kiosks
          </p>
        </div>
      </div>

      {/* Notifications / Toast */}
      {toast && (
        <div
          className={`flex items-center gap-2 rounded-xl p-4 text-sm font-bold border transition ${
            toast.type === "success"
              ? "bg-teal-50 border-teal-200 text-teal-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-teal-600 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Quick Add Product Barcode Modal / Card */}
      {showAddModal && (
        <div className="panel p-6 border-2 border-brand/30 bg-blue-50/20 shadow-md">
          <div className="flex items-center justify-between pb-3 border-b">
            <div>
              <h2 className="text-lg font-extrabold text-navy flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-brand" /> Add Educational Product Barcode
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Automatically registers with Code128 formatting, mission aisle matching, and mobile camera scanning.
              </p>
            </div>
            <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => setShowAddModal(false)}>
              ✕
            </Button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setToast(null);
              const fd = new FormData(e.currentTarget);
              startTransition(async () => {
                const res = await createQuickProductBarcode(fd);
                if (res?.error) {
                  setToast({ type: "error", message: res.error });
                } else {
                  setToast({ type: "success", message: "Created and registered new barcode label successfully!" });
                  setShowAddModal(false);
                }
              });
            }}
            className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-4"
          >
            <label className="text-xs font-bold sm:col-span-2">
              Product Name *
              <input
                required
                name="name"
                placeholder="e.g. Fresh Sweet Corn, Organic Bananas"
                className="mt-1 h-10 w-full rounded-xl border bg-white px-3 font-normal"
              />
            </label>

            <label className="text-xs font-bold sm:col-span-2">
              Barcode (UPC / Code128 / Numbers) *
              <input
                required
                name="barcode"
                placeholder="e.g. 012345678905, C2CBANANA01"
                className="mt-1 h-10 w-full rounded-xl border bg-white px-3 font-mono font-bold text-navy"
              />
            </label>

            <label className="text-xs font-bold">
              Price ($ USD)
              <input
                type="number"
                step="0.01"
                min="0"
                name="price"
                defaultValue="1.00"
                className="mt-1 h-10 w-full rounded-xl border bg-white px-3 font-normal"
              />
            </label>

            <label className="text-xs font-bold">
              Package / Unit Size
              <input
                name="packageSize"
                defaultValue="1 each"
                placeholder="e.g. 2 for $1, 500g"
                className="mt-1 h-10 w-full rounded-xl border bg-white px-3 font-normal"
              />
            </label>

            <label className="text-xs font-bold">
              Category
              <select name="category" className="mt-1 h-10 w-full rounded-xl border bg-white px-3 font-normal">
                <option value="Produce">Produce</option>
                <option value="Bakery">Bakery</option>
                <option value="Dairy">Dairy</option>
                <option value="Pantry">Pantry</option>
                <option value="Educational">Educational Demo</option>
              </select>
            </label>

            <label className="text-xs font-bold">
              Assign to Mission
              <select name="missionId" className="mt-1 h-10 w-full rounded-xl border bg-white px-3 font-normal">
                <option value="">Default Active Mission</option>
                {missions.map((m) => (
                  <option key={m.id} value={m.id}>
                    Mission {m.number}: {m.title}
                  </option>
                ))}
              </select>
            </label>

            <div className="sm:col-span-2 md:col-span-4 flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="bg-navy font-bold text-white">
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving Barcode...
                  </>
                ) : (
                  "Create & Publish Barcode"
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Filter Tabs, Search & Usage Sorting */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab("all")}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold transition ${
              activeTab === "all" ? "bg-navy text-white shadow-2xs" : "bg-white border text-muted hover:text-ink"
            }`}
          >
            <Layers className="h-3.5 w-3.5" /> All Codes ({totalCount})
          </button>
          <button
            onClick={() => setActiveTab("products")}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold transition ${
              activeTab === "products"
                ? "bg-navy text-white shadow-2xs"
                : "bg-white border text-muted hover:text-ink"
            }`}
          >
            <Barcode className="h-3.5 w-3.5" /> Product Barcodes ({filteredProducts.length})
          </button>
          <button
            onClick={() => setActiveTab("missions")}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold transition ${
              activeTab === "missions"
                ? "bg-navy text-white shadow-2xs"
                : "bg-white border text-muted hover:text-ink"
            }`}
          >
            <QrCode className="h-3.5 w-3.5" /> Mission QRs ({filteredMissions.length})
          </button>
          {role !== "store" && (
            <button
              onClick={() => setActiveTab("students")}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold transition ${
                activeTab === "students"
                  ? "bg-navy text-white shadow-2xs"
                  : "bg-white border text-muted hover:text-ink"
              }`}
            >
              <School className="h-3.5 w-3.5" /> Student QR Cards ({filteredStudents.length})
            </button>
          )}
          <button
            onClick={() => setActiveTab("stores")}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold transition ${
              activeTab === "stores"
                ? "bg-navy text-white shadow-2xs"
                : "bg-white border text-muted hover:text-ink"
            }`}
          >
            <Building2 className="h-3.5 w-3.5" /> Store Check-in QRs ({filteredStores.length})
          </button>
        </div>

        {/* Search, Usage Filter & Sorting */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Usage Filter Dropdown */}
          <div className="flex items-center rounded-xl border bg-white px-2.5 py-1 text-xs font-bold text-slate-700">
            <Filter className="mr-1.5 h-3.5 w-3.5 text-muted" />
            <select
              value={usageFilter}
              onChange={(e) => setUsageFilter(e.target.value as any)}
              className="bg-transparent text-xs font-bold focus:outline-none"
            >
              <option value="all">All Usages</option>
              <option value="used">Used Only (&gt;0 scans)</option>
              <option value="unused">Unused (0 scans)</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center rounded-xl border bg-white px-2.5 py-1 text-xs font-bold text-slate-700">
            <ArrowUpDown className="mr-1.5 h-3.5 w-3.5 text-muted" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs font-bold focus:outline-none"
            >
              <option value="most_used">Most Scans First</option>
              <option value="recent">Recently Scanned</option>
              <option value="alpha">Alphabetical (A-Z)</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search code or barcode..."
              className="h-9 w-full rounded-xl border bg-white pl-9 pr-3 text-xs placeholder:text-muted focus:outline-brand"
            />
          </div>
        </div>
      </div>

      {/* 4. Grid of Codes with Usage Counters */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {/* 1. PRODUCT BARCODES */}
        {(activeTab === "all" || activeTab === "products") &&
          filteredProducts.map((p) => {
            const count = p.usage_count || 0;
            const isScanning = scanningCodeId === p.barcode;
            return (
              <article
                key={`prod-${p.id || p.barcode}`}
                className="panel p-5 bg-white border flex flex-col justify-between hover:shadow-sm transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wide">
                        Product Barcode (Code128)
                      </span>
                      <h3 className="font-extrabold text-base capitalize text-ink mt-0.5 truncate">{p.name}</h3>
                      <p className="text-xs text-muted mt-0.5 truncate">
                        {p.category ?? "Produce"} · ${((p.price ?? 100) / (p.price && p.price > 20 ? 100 : 1)).toFixed(2)} · {p.package_size ?? "1 each"}
                      </p>
                    </div>

                    {/* Prominent Usage Counter Badge */}
                    <div className="shrink-0 text-right">
                      {count > 0 ? (
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-emerald-50 border border-emerald-300 px-3 py-1 text-xs font-black text-emerald-800 shadow-2xs shrink-0">
                          <Flame className="h-3.5 w-3.5 text-emerald-600 animate-pulse shrink-0" />
                          <span>{count} {count === 1 ? "Scan" : "Scans"}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-bold text-slate-500 shrink-0">
                          <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>0 Scans</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Scannable Barcode */}
                  <div className="mt-3">
                    <BarcodeExportButton
                      value={p.barcode}
                      label={p.name}
                      subtitle={`Code128: ${p.barcode}`}
                      symbology="CODE128"
                    />
                  </div>

                  {/* Activity Indicator */}
                  <div className="mt-3 flex items-center justify-between text-[11px] text-muted border-t border-slate-100 pt-2">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last used: {formatRelativeTime(p.last_used_at)}
                    </span>
                    <button
                      type="button"
                      disabled={isPending || isScanning}
                      onClick={() => handleTestScan("product", p.barcode, p.name)}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold text-brand bg-blue-50 hover:bg-blue-100 transition"
                      title="Simulate scanning this product barcode to test the live usage counter"
                    >
                      {isScanning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                      Test Scan +1
                    </button>
                  </div>
                </div>

                {/* Footer Actions & Delete */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t">
                  <span className="text-[11px] font-mono font-bold text-slate-500">
                    {p.barcode}
                  </span>
                  <Button
                    variant="ghost"
                    disabled={isPending}
                    onClick={() => handleDeleteBarcode(p.barcode, p.mission_product_id, p.id, p.name)}
                    className="h-7 px-2 text-rose-600 hover:bg-rose-50 text-xs font-bold"
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete Barcode
                  </Button>
                </div>
              </article>
            );
          })}

        {/* 2. MISSION QR CODES */}
        {(activeTab === "all" || activeTab === "missions") &&
          filteredMissions.map((m) => {
            const count = m.usage_count || 0;
            const isScanning = scanningCodeId === m.id;
            return (
              <article
                key={`mis-${m.id}`}
                className="panel p-5 bg-white border flex flex-col justify-between hover:shadow-sm transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-bold text-brand uppercase tracking-wide">
                        Mission QR Launcher
                      </span>
                      <h3 className="font-extrabold text-base text-ink mt-0.5 truncate">{m.title}</h3>
                      <p className="text-xs text-muted mt-0.5 truncate">
                        Mission #{m.number} · v{m.version} · {m.minutes} mins
                      </p>
                    </div>

                    {/* Usage Counter Badge */}
                    <div className="shrink-0 text-right">
                      {count > 0 ? (
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-blue-50 border border-blue-300 px-3 py-1 text-xs font-black text-blue-800 shadow-2xs shrink-0">
                          <Flame className="h-3.5 w-3.5 text-blue-600 animate-pulse shrink-0" />
                          <span>{count} {count === 1 ? "Launch" : "Launches"}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-500 shrink-0">
                          <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>0 Launches</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Scannable QR */}
                  <div className="mt-4">
                    <QrExportButton
                      type="mission"
                      target={{
                        id: m.id,
                        label: m.title,
                        subtitle: `Mission #${m.number} · v${m.version}`
                      }}
                    />
                  </div>

                  {/* Activity Indicator */}
                  <div className="mt-3 flex items-center justify-between text-[11px] text-muted border-t border-slate-100 pt-2">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last used: {formatRelativeTime(m.last_used_at)}
                    </span>
                    <button
                      type="button"
                      disabled={isPending || isScanning}
                      onClick={() => handleTestScan("mission", m.id, m.title)}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold text-brand bg-blue-50 hover:bg-blue-100 transition"
                      title="Simulate scanning this mission launcher QR code to test the counter"
                    >
                      {isScanning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                      Test Launch +1
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t text-xs">
                  <span className="font-bold text-slate-500">Mission Status:</span>
                  <Badge tone={m.status === "published" ? "green" : "amber"}>{m.status}</Badge>
                </div>
              </article>
            );
          })}

        {/* 3. STUDENT QR CARDS */}
        {role !== "store" &&
          (activeTab === "all" || activeTab === "students") &&
          filteredStudents.map((s) => {
            const count = s.usage_count || 0;
            const isScanning = scanningCodeId === s.id;
            return (
              <article
                key={`stu-${s.id}`}
                className="panel p-5 bg-white border flex flex-col justify-between hover:shadow-sm transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wide">
                        Student Login QR Card
                      </span>
                      <h3 className="font-extrabold text-base text-ink mt-0.5 truncate">{s.name}</h3>
                      <p className="text-xs text-muted mt-0.5 truncate">
                        {s.room} · Grade {s.grade}
                      </p>
                    </div>

                    {/* Usage Counter Badge */}
                    <div className="shrink-0 text-right">
                      {count > 0 ? (
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-purple-50 border border-purple-300 px-3 py-1 text-xs font-black text-purple-800 shadow-2xs shrink-0">
                          <Flame className="h-3.5 w-3.5 text-purple-600 animate-pulse shrink-0" />
                          <span>{count} {count === 1 ? "Login" : "Logins"}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-bold text-slate-500 shrink-0">
                          <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>0 Logins</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Scannable Student QR */}
                  <div className="mt-4">
                    <QrExportButton
                      compact
                      type="student"
                      target={{
                        id: s.id,
                        label: s.name,
                        subtitle: `${s.room} · Grade ${s.grade}`
                      }}
                    />
                  </div>

                  {/* Activity Indicator */}
                  <div className="mt-3 flex items-center justify-between text-[11px] text-muted border-t border-slate-100 pt-2">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last used: {formatRelativeTime(s.last_used_at)}
                    </span>
                    <button
                      type="button"
                      disabled={isPending || isScanning}
                      onClick={() => handleTestScan("student", s.id, s.name)}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 transition"
                      title="Simulate scanning this student QR card to test login counter"
                    >
                      {isScanning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                      Test Login +1
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t text-xs">
                  <span className="font-bold text-slate-500">Card Status:</span>
                  <Badge tone={s.active ? "green" : "slate"}>{s.active ? "Active" : "Inactive"}</Badge>
                </div>
              </article>
            );
          })}

        {/* 4. STORE CHECK-IN QRS */}
        {(activeTab === "all" || activeTab === "stores") &&
          filteredStores.map((st) => {
            const count = st.usage_count || 0;
            const isScanning = scanningCodeId === st.id;
            return (
              <article
                key={`store-${st.id}`}
                className="panel p-5 bg-white border flex flex-col justify-between hover:shadow-sm transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wide">
                        Store Check-in QR
                      </span>
                      <h3 className="font-extrabold text-base text-ink mt-0.5 truncate">{st.name}</h3>
                      <p className="text-xs text-muted mt-0.5 truncate">Store entrance & geofence trigger</p>
                    </div>

                    {/* Usage Counter Badge */}
                    <div className="shrink-0 text-right">
                      {count > 0 ? (
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-amber-50 border border-amber-300 px-3 py-1 text-xs font-black text-amber-800 shadow-2xs shrink-0">
                          <Flame className="h-3.5 w-3.5 text-amber-600 animate-pulse shrink-0" />
                          <span>{count} {count === 1 ? "Check-in" : "Check-ins"}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-bold text-slate-500 shrink-0">
                          <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>0 Check-ins</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Scannable Store QR */}
                  <div className="mt-4">
                    <QrExportButton
                      compact
                      type="store"
                      target={{
                        id: st.id,
                        label: st.name,
                        subtitle: "Store check-in · Scan to begin mission"
                      }}
                    />
                  </div>

                  {/* Activity Indicator */}
                  <div className="mt-3 flex items-center justify-between text-[11px] text-muted border-t border-slate-100 pt-2">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last used: {formatRelativeTime(st.last_used_at)}
                    </span>
                    <button
                      type="button"
                      disabled={isPending || isScanning}
                      onClick={() => handleTestScan("store", st.id, st.name)}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 transition"
                      title="Simulate scanning this store entrance QR code to test check-in counter"
                    >
                      {isScanning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                      Test Check-in +1
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t text-xs">
                  <span className="font-bold text-slate-500">Kiosk Status:</span>
                  <Badge tone={st.active ? "green" : "slate"}>{st.active ? "Active" : "Inactive"}</Badge>
                </div>
              </article>
            );
          })}
      </div>

      {totalCount === 0 && (
        <div className="panel p-12 text-center">
          <Barcode className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-3 text-lg font-extrabold text-ink">No codes found</h3>
          <p className="mt-1 text-sm text-muted">
            {search || usageFilter !== "all"
              ? "No codes matched your filter and search criteria. Try adjusting the filters."
              : "Add a product barcode or mission to begin."}
          </p>
          <Button onClick={() => setShowAddModal(true)} className="mt-4 bg-navy text-white font-bold">
            <Plus className="mr-1.5 h-4 w-4" /> Add Barcode
          </Button>
        </div>
      )}
    </main>
  );
}
