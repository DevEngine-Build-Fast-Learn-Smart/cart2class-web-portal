"use client";

import { useState, useTransition } from "react";
import {
  QrCode,
  Barcode,
  ShoppingBag,
  School,
  Building2,
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Printer,
  Sparkles,
  Layers
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
  deleteProductBarcode
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
};

type MissionQrItem = {
  id: string;
  title: string;
  number: number;
  version: number;
  status: string;
  minutes: number;
};

type StudentQrItem = {
  id: string;
  name: string;
  room: string;
  grade: number;
  active: boolean;
};

type StoreQrItem = {
  id: string;
  name: string;
  active: boolean;
};

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
  const [showAddModal, setShowAddModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Search filter
  const q = search.trim().toLowerCase();

  const filteredProducts = products.filter(
    (p) => !q || p.name.toLowerCase().includes(q) || p.barcode.toLowerCase().includes(q)
  );

  const filteredMissions = missions.filter(
    (m) => !q || m.title.toLowerCase().includes(q) || `mission ${m.number}`.includes(q)
  );

  const filteredStudents = students.filter(
    (s) => !q || s.name.toLowerCase().includes(q) || s.room.toLowerCase().includes(q)
  );

  const filteredStores = stores.filter(
    (st) => !q || st.name.toLowerCase().includes(q)
  );

  const totalCount =
    filteredProducts.length + filteredMissions.length + filteredStudents.length + filteredStores.length;

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
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-teal-50 text-teal-700 shadow-2xs">
            <Barcode className="h-6 w-6" />
          </div>
          <div>
            <p className="eyebrow capitalize">{role} portal</p>
            <h1 className="mt-0.5 text-3xl font-black text-navy">QR & Barcode Center</h1>
            <p className="mt-1 text-sm text-muted">
              Live scannable labels, PDF print sheets, and lifecycle management for mission barcodes and student cards.
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

      {/* Filter Tabs & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
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

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search code, name, or barcode..."
            className="h-9 w-full rounded-xl border bg-white pl-9 pr-3 text-xs placeholder:text-muted focus:outline-brand"
          />
        </div>
      </div>

      {/* Grid of Codes */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {/* 1. PRODUCT BARCODES */}
        {(activeTab === "all" || activeTab === "products") &&
          filteredProducts.map((p) => (
            <article
              key={`prod-${p.id || p.barcode}`}
              className="panel p-5 bg-white border flex flex-col justify-between hover:shadow-xs transition"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wide">
                      Product Barcode (Code128)
                    </span>
                    <h3 className="font-extrabold text-base capitalize text-ink mt-0.5">{p.name}</h3>
                    <p className="text-xs text-muted mt-0.5">
                      {p.category ?? "Produce"} · ${((p.price ?? 100) / (p.price && p.price > 20 ? 100 : 1)).toFixed(2)} · {p.package_size ?? "1 each"}
                    </p>
                  </div>
                  <Badge tone="green">Scannable</Badge>
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
              </div>

              {/* Actions & Delete */}
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
          ))}

        {/* 2. MISSION QR CODES */}
        {(activeTab === "all" || activeTab === "missions") &&
          filteredMissions.map((m) => (
            <article
              key={`mis-${m.id}`}
              className="panel p-5 bg-white border flex flex-col justify-between hover:shadow-xs transition"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-brand uppercase tracking-wide">
                      Mission QR Launcher
                    </span>
                    <h3 className="font-extrabold text-base text-ink mt-0.5">{m.title}</h3>
                    <p className="text-xs text-muted mt-0.5">
                      Mission #{m.number} · v{m.version} · {m.minutes} mins
                    </p>
                  </div>
                  <Badge tone={m.status === "published" ? "green" : "amber"}>{m.status}</Badge>
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
              </div>
            </article>
          ))}

        {/* 3. STUDENT QR CARDS */}
        {role !== "store" &&
          (activeTab === "all" || activeTab === "students") &&
          filteredStudents.map((s) => (
            <article
              key={`stu-${s.id}`}
              className="panel p-5 bg-white border flex flex-col justify-between hover:shadow-xs transition"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wide">
                      Student Login QR Card
                    </span>
                    <h3 className="font-extrabold text-base text-ink mt-0.5">{s.name}</h3>
                    <p className="text-xs text-muted mt-0.5">
                      {s.room} · Grade {s.grade}
                    </p>
                  </div>
                  <Badge tone={s.active ? "green" : "slate"}>{s.active ? "Active" : "Inactive"}</Badge>
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
              </div>
            </article>
          ))}

        {/* 4. STORE CHECK-IN QRS */}
        {(activeTab === "all" || activeTab === "stores") &&
          filteredStores.map((st) => (
            <article
              key={`store-${st.id}`}
              className="panel p-5 bg-white border flex flex-col justify-between hover:shadow-xs transition"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wide">
                      Store Check-in QR
                    </span>
                    <h3 className="font-extrabold text-base text-ink mt-0.5">{st.name}</h3>
                    <p className="text-xs text-muted mt-0.5">Store entrance & geofence trigger</p>
                  </div>
                  <Badge tone={st.active ? "green" : "slate"}>{st.active ? "Active" : "Inactive"}</Badge>
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
              </div>
            </article>
          ))}
      </div>

      {totalCount === 0 && (
        <div className="panel p-12 text-center">
          <Barcode className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-3 text-lg font-extrabold text-ink">No codes found</h3>
          <p className="mt-1 text-sm text-muted">
            {search ? `No codes matched "${search}". Try another search.` : "Add a product barcode or mission to begin."}
          </p>
          <Button onClick={() => setShowAddModal(true)} className="mt-4 bg-navy text-white font-bold">
            <Plus className="mr-1.5 h-4 w-4" /> Add Barcode
          </Button>
        </div>
      )}
    </main>
  );
}

