import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { api } from "@/lib/api";

interface WarehouseItem {
  id: number;
  name: string;
  sku: string | null;
  unit: string;
  quantity: number;
  price: number;
  category: string | null;
  updated_at: string;
}

interface Transaction {
  id: number;
  item_id: number;
  item_name: string;
  work_order_id: number | null;
  work_order_number: string | null;
  type: "income" | "expense";
  quantity: number;
  price: number | null;
  note: string | null;
  created_by_name: string;
  created_at: string;
}

type Tab = "items" | "transactions";
type TxType = "income" | "expense";

function formatMoney(n: number) {
  return new Intl.NumberFormat("ru-RU").format(n);
}
function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function WarehousePage() {
  const [tab, setTab] = useState<Tab>("items");
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [stats, setStats] = useState({ total_items: 0, total_value: 0 });

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterTxType, setFilterTxType] = useState("");

  // Модалки
  const [showItemModal, setShowItemModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [editItem, setEditItem] = useState<WarehouseItem | null>(null);
  const [txItem, setTxItem] = useState<WarehouseItem | null>(null);
  const [txType, setTxType] = useState<TxType>("income");

  const [itemForm, setItemForm] = useState({
    name: "", sku: "", unit: "шт", quantity: 0, price: 0, category: "",
  });
  const [txForm, setTxForm] = useState({ quantity: 1, price: 0, note: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [itemsRes, txRes, catsRes, statsRes] = await Promise.all([
        api.getWarehouseItems(),
        api.getWarehouseTransactions(),
        api.getWarehouseCategories(),
        api.getWarehouseStats(),
      ]);
      if (itemsRes.status === 200) setItems(itemsRes.data.items || []);
      if (txRes.status === 200) setTransactions(txRes.data.transactions || []);
      if (catsRes.status === 200) setCategories(catsRes.data.categories || []);
      if (statsRes.status === 200) setStats(statsRes.data);
    } catch { /* ignore */ }
    setLoading(false);
  }

  const filteredItems = items.filter((i) => {
    const q = search.toLowerCase();
    const matchSearch = !q || i.name.toLowerCase().includes(q) || (i.sku || "").toLowerCase().includes(q);
    const matchCat = !filterCategory || i.category === filterCategory;
    return matchSearch && matchCat;
  });

  const filteredTx = transactions.filter((t) => {
    return !filterTxType || t.type === filterTxType;
  });

  function openItemModal(item?: WarehouseItem) {
    if (item) {
      setEditItem(item);
      setItemForm({ name: item.name, sku: item.sku || "", unit: item.unit, quantity: item.quantity, price: item.price, category: item.category || "" });
    } else {
      setEditItem(null);
      setItemForm({ name: "", sku: "", unit: "шт", quantity: 0, price: 0, category: "" });
    }
    setError("");
    setShowItemModal(true);
  }

  async function saveItem() {
    if (!itemForm.name.trim()) { setError("Введите название товара"); return; }
    setSaving(true); setError("");
    try {
      let res;
      if (editItem) {
        res = await api.updateWarehouseItem(editItem.id, {
          name: itemForm.name, sku: itemForm.sku, unit: itemForm.unit,
          price: Number(itemForm.price), category: itemForm.category,
        });
      } else {
        res = await api.createWarehouseItem({
          name: itemForm.name, sku: itemForm.sku, unit: itemForm.unit,
          quantity: Number(itemForm.quantity), price: Number(itemForm.price),
          category: itemForm.category,
        });
      }
      if (res.status === 200) { setShowItemModal(false); loadData(); }
      else setError(res.data.error || "Ошибка");
    } catch { setError("Ошибка сети"); }
    setSaving(false);
  }

  function openTxModal(item: WarehouseItem, type: TxType) {
    setTxItem(item);
    setTxType(type);
    setTxForm({ quantity: 1, price: item.price, note: "" });
    setError("");
    setShowTxModal(true);
  }

  async function saveTx() {
    if (!txItem || txForm.quantity <= 0) { setError("Укажите количество > 0"); return; }
    setSaving(true); setError("");
    try {
      let res;
      if (txType === "income") {
        res = await api.warehouseIncome(txItem.id, Number(txForm.quantity), Number(txForm.price), txForm.note);
      } else {
        res = await api.warehouseExpense(txItem.id, Number(txForm.quantity), undefined, txForm.note);
      }
      if (res.status === 200) { setShowTxModal(false); loadData(); }
      else setError(res.data.error || "Ошибка");
    } catch { setError("Ошибка сети"); }
    setSaving(false);
  }

  const lowStockItems = items.filter((i) => i.quantity < 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Склад</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Учёт товаров, приход и расход</p>
        </div>
        <button
          onClick={() => openItemModal()}
          className="h-9 px-4 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 flex items-center gap-1.5"
        >
          <Icon name="Plus" size={15} />
          Добавить товар
        </button>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Позиций</p>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Icon name="Package" size={15} className="text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.total_items}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Стоимость склада</p>
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <Icon name="Banknote" size={15} className="text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{formatMoney(stats.total_value)} сом</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Заканчиваются</p>
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
              <Icon name="AlertTriangle" size={15} className="text-orange-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{lowStockItems.length}</p>
          <p className="text-xs text-orange-500 mt-1">менее 5 ед.</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Операций</p>
            <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
              <Icon name="ArrowUpDown" size={15} className="text-violet-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{transactions.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="flex border-b border-border">
          <button
            onClick={() => setTab("items")}
            className={`px-5 py-3.5 text-sm font-semibold transition-colors border-b-2 ${tab === "items" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <Icon name="Package" size={15} className="inline mr-2" />
            Товары
          </button>
          <button
            onClick={() => setTab("transactions")}
            className={`px-5 py-3.5 text-sm font-semibold transition-colors border-b-2 ${tab === "transactions" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <Icon name="ArrowUpDown" size={15} className="inline mr-2" />
            Движение товаров
          </button>
        </div>

        {tab === "items" ? (
          <>
            {/* Фильтры */}
            <div className="flex gap-3 p-4 border-b border-border">
              <div className="relative flex-1 max-w-xs">
                <input
                  type="text"
                  placeholder="Поиск по названию или артикулу..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-9 pl-8 pr-3 text-sm bg-secondary border-0 rounded-lg outline-none focus:ring-1 focus:ring-primary/40"
                />
                <Icon name="Search" size={14} className="absolute left-2.5 top-2.5 text-muted-foreground" />
              </div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="h-9 px-3 text-sm bg-secondary border-0 rounded-lg outline-none focus:ring-1 focus:ring-primary/40"
              >
                <option value="">Все категории</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Icon name="Package" size={40} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm">Товаров не найдено</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30">
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-5 py-3">Наименование</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">Артикул</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">Категория</th>
                      <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">Кол-во</th>
                      <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">Цена</th>
                      <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">Сумма</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredItems.map((item) => {
                      const isLow = item.quantity < 5;
                      return (
                        <tr key={item.id} className="hover:bg-secondary/20 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Icon name="Package" size={14} className="text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">{item.name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-muted-foreground font-mono">{item.sku || "—"}</td>
                          <td className="px-4 py-3.5">
                            {item.category && (
                              <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">{item.category}</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <span className={`text-sm font-bold ${isLow ? "text-orange-500" : "text-foreground"}`}>
                              {item.quantity}
                            </span>
                            <span className="text-xs text-muted-foreground ml-1">{item.unit}</span>
                            {isLow && <Icon name="AlertTriangle" size={12} className="inline ml-1 text-orange-500" />}
                          </td>
                          <td className="px-4 py-3.5 text-right text-sm text-muted-foreground">
                            {formatMoney(item.price)} сом
                          </td>
                          <td className="px-4 py-3.5 text-right text-sm font-medium text-foreground">
                            {formatMoney(item.quantity * item.price)} сом
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openTxModal(item, "income")}
                                className="h-7 px-2 bg-green-50 text-green-700 text-xs font-semibold rounded-lg hover:bg-green-100 flex items-center gap-1"
                                title="Приход"
                              >
                                <Icon name="ArrowDown" size={12} />
                                Приход
                              </button>
                              <button
                                onClick={() => openTxModal(item, "expense")}
                                className="h-7 px-2 bg-red-50 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-100 flex items-center gap-1"
                                title="Расход"
                              >
                                <Icon name="ArrowUp" size={12} />
                                Расход
                              </button>
                              <button
                                onClick={() => openItemModal(item)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-secondary text-muted-foreground"
                              >
                                <Icon name="Pencil" size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Фильтр транзакций */}
            <div className="flex gap-3 p-4 border-b border-border">
              <div className="flex gap-2">
                {[
                  { val: "", label: "Все" },
                  { val: "income", label: "Приход" },
                  { val: "expense", label: "Расход" },
                ].map((f) => (
                  <button
                    key={f.val}
                    onClick={() => setFilterTxType(f.val)}
                    className={`h-8 px-3 text-xs font-semibold rounded-lg transition-colors ${filterTxType === f.val ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
              </div>
            ) : filteredTx.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Icon name="ArrowUpDown" size={40} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm">Нет операций</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredTx.map((tx) => (
                  <div key={tx.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-secondary/20 transition-colors">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${tx.type === "income" ? "bg-green-50" : "bg-red-50"}`}>
                      <Icon
                        name={tx.type === "income" ? "ArrowDown" : "ArrowUp"}
                        size={16}
                        className={tx.type === "income" ? "text-green-600" : "text-red-500"}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{tx.item_name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {tx.work_order_number && (
                          <span className="text-xs text-primary">{tx.work_order_number}</span>
                        )}
                        {tx.note && <span className="text-xs text-muted-foreground truncate">{tx.note}</span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-bold ${tx.type === "income" ? "text-green-600" : "text-red-500"}`}>
                        {tx.type === "income" ? "+" : "−"}{tx.quantity}
                      </p>
                      {tx.price !== null && (
                        <p className="text-xs text-muted-foreground">{formatMoney(tx.price)} сом</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0 hidden md:block">
                      <p className="text-xs text-muted-foreground">{tx.created_by_name}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(tx.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ─── Модал: Товар ─── */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
              <h3 className="text-base font-bold text-foreground">
                {editItem ? "Редактировать товар" : "Добавить товар"}
              </h3>
              <button onClick={() => setShowItemModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary text-muted-foreground">
                <Icon name="X" size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Наименование *</label>
                <input type="text" value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  placeholder="Масло моторное 5W-30" className="w-full h-10 px-3 text-sm bg-secondary border-0 rounded-lg outline-none focus:ring-1 focus:ring-primary/40" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Артикул</label>
                  <input type="text" value={itemForm.sku} onChange={(e) => setItemForm({ ...itemForm, sku: e.target.value })}
                    placeholder="OIL-5W30" className="w-full h-10 px-3 text-sm bg-secondary border-0 rounded-lg outline-none focus:ring-1 focus:ring-primary/40" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Единица</label>
                  <select value={itemForm.unit} onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                    className="w-full h-10 px-3 text-sm bg-secondary border-0 rounded-lg outline-none focus:ring-1 focus:ring-primary/40">
                    {["шт", "л", "кг", "м", "комп", "уп"].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {!editItem && (
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Количество</label>
                    <input type="number" min={0} value={itemForm.quantity} onChange={(e) => setItemForm({ ...itemForm, quantity: Number(e.target.value) })}
                      className="w-full h-10 px-3 text-sm bg-secondary border-0 rounded-lg outline-none focus:ring-1 focus:ring-primary/40" />
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Цена (сом)</label>
                  <input type="number" min={0} value={itemForm.price} onChange={(e) => setItemForm({ ...itemForm, price: Number(e.target.value) })}
                    className="w-full h-10 px-3 text-sm bg-secondary border-0 rounded-lg outline-none focus:ring-1 focus:ring-primary/40" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Категория</label>
                <input type="text" value={itemForm.category} onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                  placeholder="Масла, Фильтры..." list="cats"
                  className="w-full h-10 px-3 text-sm bg-secondary border-0 rounded-lg outline-none focus:ring-1 focus:ring-primary/40" />
                <datalist id="cats">{categories.map(c => <option key={c} value={c} />)}</datalist>
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowItemModal(false)} className="flex-1 h-10 bg-secondary text-foreground text-sm font-semibold rounded-lg hover:bg-secondary/80">Отмена</button>
              <button onClick={saveItem} disabled={saving} className="flex-1 h-10 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-60">
                {saving ? "Сохранение..." : "Сохранить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Модал: Транзакция ─── */}
      {showTxModal && txItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm animate-scale-in">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {txType === "income" ? "Приход товара" : "Расход товара"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">{txItem.name}</p>
              </div>
              <button onClick={() => setShowTxModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary text-muted-foreground">
                <Icon name="X" size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setTxType("income")}
                  className={`flex-1 h-9 text-sm font-semibold rounded-lg transition-colors ${txType === "income" ? "bg-green-100 text-green-700" : "bg-secondary text-muted-foreground"}`}
                >
                  <Icon name="ArrowDown" size={14} className="inline mr-1" />Приход
                </button>
                <button
                  onClick={() => setTxType("expense")}
                  className={`flex-1 h-9 text-sm font-semibold rounded-lg transition-colors ${txType === "expense" ? "bg-red-100 text-red-600" : "bg-secondary text-muted-foreground"}`}
                >
                  <Icon name="ArrowUp" size={14} className="inline mr-1" />Расход
                </button>
              </div>
              <div className="flex items-center gap-3 bg-secondary/50 rounded-lg px-3 py-2">
                <span className="text-xs text-muted-foreground">Текущий остаток:</span>
                <span className="text-sm font-bold text-foreground">{txItem.quantity} {txItem.unit}</span>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Количество *</label>
                <input type="number" min={0.1} step={0.1} value={txForm.quantity}
                  onChange={(e) => setTxForm({ ...txForm, quantity: Number(e.target.value) })}
                  className="w-full h-10 px-3 text-sm bg-secondary border-0 rounded-lg outline-none focus:ring-1 focus:ring-primary/40" />
              </div>
              {txType === "income" && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Цена (сом)</label>
                  <input type="number" min={0} value={txForm.price}
                    onChange={(e) => setTxForm({ ...txForm, price: Number(e.target.value) })}
                    className="w-full h-10 px-3 text-sm bg-secondary border-0 rounded-lg outline-none focus:ring-1 focus:ring-primary/40" />
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Примечание</label>
                <input type="text" value={txForm.note} onChange={(e) => setTxForm({ ...txForm, note: e.target.value })}
                  placeholder="Причина / поставщик..."
                  className="w-full h-10 px-3 text-sm bg-secondary border-0 rounded-lg outline-none focus:ring-1 focus:ring-primary/40" />
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowTxModal(false)} className="flex-1 h-10 bg-secondary text-foreground text-sm font-semibold rounded-lg hover:bg-secondary/80">Отмена</button>
              <button onClick={saveTx} disabled={saving}
                className={`flex-1 h-10 text-white text-sm font-semibold rounded-lg disabled:opacity-60 ${txType === "income" ? "bg-green-600 hover:bg-green-700" : "bg-red-500 hover:bg-red-600"}`}>
                {saving ? "Сохранение..." : txType === "income" ? "Принять" : "Списать"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
