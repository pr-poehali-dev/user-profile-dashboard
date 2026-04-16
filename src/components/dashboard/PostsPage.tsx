import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

interface Post {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  created_by_name: string;
}

interface WorkOrder {
  id: number;
  number: string;
  post_id: number;
  post_name: string;
  client_name: string;
  client_phone: string;
  car_model: string;
  car_plate: string;
  description: string;
  start_time: string;
  duration_hours: number;
  end_time: string;
  status: string;
  created_by_name: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Ожидает", color: "bg-yellow-100 text-yellow-700" },
  in_progress: { label: "В работе", color: "bg-blue-100 text-blue-700" },
  done: { label: "Выполнен", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Отменён", color: "bg-red-100 text-red-600" },
};

function formatTime(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

// Высота 1 часа в пикселях
const HOUR_H = 60;
const DAY_START = 8; // 08:00

function timeToOffset(iso: string) {
  const d = new Date(iso);
  const h = d.getHours() + d.getMinutes() / 60;
  return (h - DAY_START) * HOUR_H;
}

export default function PostsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "Администратор";
  const canManage = user?.role === "Администратор" || user?.role === "Менеджер";

  const [posts, setPosts] = useState<Post[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [view, setView] = useState<"schedule" | "list">("schedule");

  // Модальные окна
  const [showPostModal, setShowPostModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [editPost, setEditPost] = useState<Post | null>(null);
  const [editOrder, setEditOrder] = useState<WorkOrder | null>(null);

  // Формы
  const [postForm, setPostForm] = useState({ name: "", description: "" });
  const [orderForm, setOrderForm] = useState({
    post_id: 0,
    client_name: "",
    client_phone: "",
    car_model: "",
    car_plate: "",
    description: "",
    start_time: "",
    duration_hours: 1,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  async function loadData() {
    setLoading(true);
    try {
      const [postsRes, ordersRes] = await Promise.all([
        api.getPosts(),
        api.getWorkOrders({ date: selectedDate }),
      ]);
      if (postsRes.status === 200) setPosts(postsRes.data.posts || []);
      if (ordersRes.status === 200) setWorkOrders(ordersRes.data.work_orders || []);
    } catch {
      // ignore
    }
    setLoading(false);
  }

  function ordersForPost(postId: number) {
    return workOrders.filter((o) => o.post_id === postId);
  }

  // Создать/редактировать пост
  function openPostModal(post?: Post) {
    if (post) {
      setEditPost(post);
      setPostForm({ name: post.name, description: post.description || "" });
    } else {
      setEditPost(null);
      setPostForm({ name: "", description: "" });
    }
    setError("");
    setShowPostModal(true);
  }

  async function savePost() {
    if (!postForm.name.trim()) { setError("Введите название поста"); return; }
    setSaving(true);
    setError("");
    try {
      let res;
      if (editPost) {
        res = await api.updatePost(editPost.id, postForm.name, postForm.description, true);
      } else {
        res = await api.createPost(postForm.name, postForm.description);
      }
      if (res.status === 200) {
        setShowPostModal(false);
        loadData();
      } else {
        setError(res.data.error || "Ошибка сохранения");
      }
    } catch {
      setError("Ошибка сети");
    }
    setSaving(false);
  }

  // Создать наряд-заказ
  function openOrderModal(post?: Post) {
    setEditOrder(null);
    setOrderForm({
      post_id: post?.id || (posts[0]?.id || 0),
      client_name: "",
      client_phone: "",
      car_model: "",
      car_plate: "",
      description: "",
      start_time: selectedDate + "T09:00",
      duration_hours: 1,
    });
    setError("");
    setShowOrderModal(true);
  }

  function openEditOrderModal(order: WorkOrder) {
    setEditOrder(order);
    setOrderForm({
      post_id: order.post_id,
      client_name: order.client_name || "",
      client_phone: order.client_phone || "",
      car_model: order.car_model || "",
      car_plate: order.car_plate || "",
      description: order.description || "",
      start_time: order.start_time ? order.start_time.slice(0, 16) : "",
      duration_hours: order.duration_hours,
    });
    setError("");
    setShowOrderModal(true);
  }

  async function saveOrder() {
    if (!orderForm.post_id) { setError("Выберите пост"); return; }
    if (!orderForm.start_time) { setError("Укажите время начала"); return; }
    setSaving(true);
    setError("");
    try {
      let res;
      if (editOrder) {
        res = await api.updateWorkOrder(editOrder.id, {
          client_name: orderForm.client_name,
          car_model: orderForm.car_model,
          car_plate: orderForm.car_plate,
          description: orderForm.description,
        });
      } else {
        res = await api.createWorkOrder({
          post_id: orderForm.post_id,
          client_name: orderForm.client_name,
          client_phone: orderForm.client_phone,
          car_model: orderForm.car_model,
          car_plate: orderForm.car_plate,
          description: orderForm.description,
          start_time: new Date(orderForm.start_time).toISOString(),
          duration_hours: Number(orderForm.duration_hours),
        });
      }
      if (res.status === 200) {
        setShowOrderModal(false);
        loadData();
      } else {
        setError(res.data.error || "Ошибка сохранения");
      }
    } catch {
      setError("Ошибка сети");
    }
    setSaving(false);
  }

  async function changeOrderStatus(orderId: number, status: string) {
    await api.updateWorkOrder(orderId, { status });
    loadData();
  }

  const hours = Array.from({ length: 14 }, (_, i) => DAY_START + i); // 08:00 - 21:00

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Посты и наряд-заказы</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Расписание постов и управление наряд-заказами</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Дата */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-9 px-3 text-sm bg-secondary border-0 rounded-lg outline-none focus:ring-1 focus:ring-primary/40"
          />
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setView("schedule")}
              className={`px-3 py-2 text-sm font-medium transition-colors ${view === "schedule" ? "bg-primary text-white" : "hover:bg-secondary text-muted-foreground"}`}
            >
              <Icon name="LayoutDashboard" size={15} className="inline mr-1.5" />
              Расписание
            </button>
            <button
              onClick={() => setView("list")}
              className={`px-3 py-2 text-sm font-medium transition-colors ${view === "list" ? "bg-primary text-white" : "hover:bg-secondary text-muted-foreground"}`}
            >
              <Icon name="List" size={15} className="inline mr-1.5" />
              Список
            </button>
          </div>
          {canManage && (
            <button
              onClick={() => openOrderModal()}
              className="h-9 px-4 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 flex items-center gap-1.5"
            >
              <Icon name="Plus" size={15} />
              Наряд-заказ
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => openPostModal()}
              className="h-9 px-4 bg-secondary text-foreground text-sm font-semibold rounded-lg hover:bg-secondary/80 flex items-center gap-1.5"
            >
              <Icon name="Plus" size={15} />
              Пост
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Icon name="Layers" size={28} className="text-primary" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">Посты не созданы</h3>
          <p className="text-sm text-muted-foreground mb-4">Создайте посты для распределения наряд-заказов</p>
          {isAdmin && (
            <button onClick={() => openPostModal()} className="h-9 px-5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90">
              Создать пост
            </button>
          )}
        </div>
      ) : view === "schedule" ? (
        /* ─── РАСПИСАНИЕ ─── */
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <div style={{ minWidth: `${160 + posts.length * 200}px` }}>
              {/* Шапка с постами */}
              <div className="flex border-b border-border bg-secondary/50">
                <div className="w-16 flex-shrink-0 px-2 py-3 text-xs text-muted-foreground font-medium border-r border-border"></div>
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="flex-1 min-w-[180px] px-4 py-3 border-r border-border last:border-r-0"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm text-foreground">{post.name}</p>
                        {post.description && (
                          <p className="text-xs text-muted-foreground truncate">{post.description}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {canManage && (
                          <button
                            onClick={() => openOrderModal(post)}
                            className="w-6 h-6 rounded flex items-center justify-center hover:bg-primary/10 text-primary"
                            title="Добавить наряд-заказ"
                          >
                            <Icon name="Plus" size={13} />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => openPostModal(post)}
                            className="w-6 h-6 rounded flex items-center justify-center hover:bg-secondary text-muted-foreground"
                            title="Редактировать пост"
                          >
                            <Icon name="Pencil" size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Временная сетка */}
              <div className="flex relative">
                {/* Часы */}
                <div className="w-16 flex-shrink-0 border-r border-border">
                  {hours.map((h) => (
                    <div
                      key={h}
                      className="border-b border-border/50 flex items-start justify-end pr-2 pt-1"
                      style={{ height: HOUR_H }}
                    >
                      <span className="text-xs text-muted-foreground font-mono">
                        {String(h).padStart(2, "0")}:00
                      </span>
                    </div>
                  ))}
                </div>

                {/* Колонки постов */}
                {posts.map((post) => {
                  const orders = ordersForPost(post.id);
                  return (
                    <div
                      key={post.id}
                      className="flex-1 min-w-[180px] border-r border-border last:border-r-0 relative"
                      style={{ height: hours.length * HOUR_H }}
                    >
                      {/* Полосы часов */}
                      {hours.map((h) => (
                        <div
                          key={h}
                          className="absolute w-full border-b border-border/30"
                          style={{ top: (h - DAY_START) * HOUR_H, height: HOUR_H }}
                        />
                      ))}

                      {/* Наряд-заказы */}
                      {orders.map((order) => {
                        const top = timeToOffset(order.start_time);
                        const height = order.duration_hours * HOUR_H;
                        const st = STATUS_LABELS[order.status] || STATUS_LABELS.pending;
                        const colorMap: Record<string, string> = {
                          pending: "bg-yellow-50 border-yellow-300 text-yellow-900",
                          in_progress: "bg-blue-50 border-blue-300 text-blue-900",
                          done: "bg-green-50 border-green-300 text-green-900",
                          cancelled: "bg-red-50 border-red-300 text-red-900",
                        };
                        return (
                          <div
                            key={order.id}
                            className={`absolute left-1 right-1 rounded-lg border-l-4 px-2 py-1.5 cursor-pointer hover:shadow-md transition-shadow overflow-hidden ${colorMap[order.status] || colorMap.pending}`}
                            style={{ top: Math.max(0, top), height: Math.max(32, height - 2) }}
                            onClick={() => openEditOrderModal(order)}
                            title={`${order.number} — ${order.client_name || "Клиент"}`}
                          >
                            <p className="text-xs font-bold truncate">{order.number}</p>
                            {height >= 50 && (
                              <>
                                {order.car_model && (
                                  <p className="text-xs truncate opacity-80">{order.car_model}</p>
                                )}
                                {order.client_name && (
                                  <p className="text-xs truncate opacity-70">{order.client_name}</p>
                                )}
                                <p className="text-xs opacity-60">
                                  {formatTime(order.start_time)} – {formatTime(order.end_time)}
                                </p>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ─── СПИСОК ─── */
        <div className="space-y-4">
          {posts.map((post) => {
            const orders = ordersForPost(post.id);
            return (
              <div key={post.id} className="bg-white rounded-xl border border-border overflow-hidden">
                {/* Пост заголовок */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon name="Layers" size={18} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{post.name}</p>
                      {post.description && (
                        <p className="text-xs text-muted-foreground">{post.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {orders.length} заказ{orders.length !== 1 ? "ов" : ""}
                    </span>
                    {canManage && (
                      <button
                        onClick={() => openOrderModal(post)}
                        className="h-7 px-3 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 flex items-center gap-1"
                      >
                        <Icon name="Plus" size={12} />
                        Добавить
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => openPostModal(post)}
                        className="h-7 px-3 bg-secondary text-foreground text-xs font-semibold rounded-lg hover:bg-secondary/80"
                      >
                        <Icon name="Pencil" size={12} className="inline mr-1" />
                        Изменить
                      </button>
                    )}
                  </div>
                </div>

                {/* Список заказов */}
                {orders.length === 0 ? (
                  <div className="px-5 py-6 text-center text-sm text-muted-foreground">
                    Нет наряд-заказов на {new Date(selectedDate).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {orders.map((order) => {
                      const st = STATUS_LABELS[order.status] || STATUS_LABELS.pending;
                      return (
                        <div
                          key={order.id}
                          className="flex items-center gap-4 px-5 py-4 hover:bg-secondary/20 transition-colors"
                        >
                          {/* Время */}
                          <div className="w-24 flex-shrink-0 text-center">
                            <p className="text-sm font-bold text-foreground">{formatTime(order.start_time)}</p>
                            <p className="text-xs text-muted-foreground">— {formatTime(order.end_time)}</p>
                            <p className="text-xs text-primary font-medium">{order.duration_hours}ч</p>
                          </div>

                          {/* Разделитель */}
                          <div className="w-1 self-stretch rounded-full bg-primary/20 flex-shrink-0" />

                          {/* Инфо */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-primary">{order.number}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
                            </div>
                            <p className="text-sm font-medium text-foreground truncate">
                              {order.car_model || "Автомобиль не указан"}
                              {order.car_plate && <span className="ml-2 text-muted-foreground text-xs">{order.car_plate}</span>}
                            </p>
                            {order.client_name && (
                              <p className="text-xs text-muted-foreground">{order.client_name}</p>
                            )}
                            {order.description && (
                              <p className="text-xs text-muted-foreground truncate mt-0.5">{order.description}</p>
                            )}
                          </div>

                          {/* Действия */}
                          {canManage && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {order.status === "pending" && (
                                <button
                                  onClick={() => changeOrderStatus(order.id, "in_progress")}
                                  className="h-7 px-2 bg-blue-50 text-blue-700 text-xs rounded-lg hover:bg-blue-100 font-medium"
                                >
                                  В работу
                                </button>
                              )}
                              {order.status === "in_progress" && (
                                <button
                                  onClick={() => changeOrderStatus(order.id, "done")}
                                  className="h-7 px-2 bg-green-50 text-green-700 text-xs rounded-lg hover:bg-green-100 font-medium"
                                >
                                  Выполнен
                                </button>
                              )}
                              <button
                                onClick={() => openEditOrderModal(order)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-secondary text-muted-foreground"
                              >
                                <Icon name="Pencil" size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Модал: Пост ─── */}
      {showPostModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
              <h3 className="text-base font-bold text-foreground">
                {editPost ? "Редактировать пост" : "Создать пост"}
              </h3>
              <button onClick={() => setShowPostModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary text-muted-foreground">
                <Icon name="X" size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Название поста *</label>
                <input
                  type="text"
                  value={postForm.name}
                  onChange={(e) => setPostForm({ ...postForm, name: e.target.value })}
                  placeholder="Пост 1"
                  className="w-full h-10 px-3 text-sm bg-secondary border-0 rounded-lg outline-none focus:ring-1 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Описание</label>
                <textarea
                  value={postForm.description}
                  onChange={(e) => setPostForm({ ...postForm, description: e.target.value })}
                  placeholder="Назначение поста..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-secondary border-0 rounded-lg outline-none focus:ring-1 focus:ring-primary/40 resize-none"
                />
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowPostModal(false)} className="flex-1 h-10 bg-secondary text-foreground text-sm font-semibold rounded-lg hover:bg-secondary/80">
                Отмена
              </button>
              <button onClick={savePost} disabled={saving} className="flex-1 h-10 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-60">
                {saving ? "Сохранение..." : "Сохранить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Модал: Наряд-заказ ─── */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg animate-scale-in">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
              <h3 className="text-base font-bold text-foreground">
                {editOrder ? `Наряд-заказ ${editOrder.number}` : "Новый наряд-заказ"}
              </h3>
              <button onClick={() => setShowOrderModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary text-muted-foreground">
                <Icon name="X" size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Пост */}
              {!editOrder && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Пост *</label>
                  <select
                    value={orderForm.post_id}
                    onChange={(e) => setOrderForm({ ...orderForm, post_id: Number(e.target.value) })}
                    className="w-full h-10 px-3 text-sm bg-secondary border-0 rounded-lg outline-none focus:ring-1 focus:ring-primary/40"
                  >
                    <option value={0}>Выберите пост</option>
                    {posts.filter(p => p.is_active).map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Время */}
              {!editOrder && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Дата и время начала *</label>
                    <input
                      type="datetime-local"
                      value={orderForm.start_time}
                      onChange={(e) => setOrderForm({ ...orderForm, start_time: e.target.value })}
                      className="w-full h-10 px-3 text-sm bg-secondary border-0 rounded-lg outline-none focus:ring-1 focus:ring-primary/40"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Длительность (ч)</label>
                    <input
                      type="number"
                      min={0.5}
                      max={12}
                      step={0.5}
                      value={orderForm.duration_hours}
                      onChange={(e) => setOrderForm({ ...orderForm, duration_hours: Number(e.target.value) })}
                      className="w-full h-10 px-3 text-sm bg-secondary border-0 rounded-lg outline-none focus:ring-1 focus:ring-primary/40"
                    />
                  </div>
                </div>
              )}

              {/* Клиент */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Клиент</label>
                  <input
                    type="text"
                    value={orderForm.client_name}
                    onChange={(e) => setOrderForm({ ...orderForm, client_name: e.target.value })}
                    placeholder="Имя клиента"
                    className="w-full h-10 px-3 text-sm bg-secondary border-0 rounded-lg outline-none focus:ring-1 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Телефон</label>
                  <input
                    type="text"
                    value={orderForm.client_phone}
                    onChange={(e) => setOrderForm({ ...orderForm, client_phone: e.target.value })}
                    placeholder="+996 ..."
                    className="w-full h-10 px-3 text-sm bg-secondary border-0 rounded-lg outline-none focus:ring-1 focus:ring-primary/40"
                  />
                </div>
              </div>

              {/* Автомобиль */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Модель авто</label>
                  <input
                    type="text"
                    value={orderForm.car_model}
                    onChange={(e) => setOrderForm({ ...orderForm, car_model: e.target.value })}
                    placeholder="Toyota Camry"
                    className="w-full h-10 px-3 text-sm bg-secondary border-0 rounded-lg outline-none focus:ring-1 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Гос. номер</label>
                  <input
                    type="text"
                    value={orderForm.car_plate}
                    onChange={(e) => setOrderForm({ ...orderForm, car_plate: e.target.value })}
                    placeholder="B 001 AB"
                    className="w-full h-10 px-3 text-sm bg-secondary border-0 rounded-lg outline-none focus:ring-1 focus:ring-primary/40"
                  />
                </div>
              </div>

              {/* Описание работ */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Описание работ</label>
                <textarea
                  value={orderForm.description}
                  onChange={(e) => setOrderForm({ ...orderForm, description: e.target.value })}
                  placeholder="Замена масла, ТО..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-secondary border-0 rounded-lg outline-none focus:ring-1 focus:ring-primary/40 resize-none"
                />
              </div>

              {/* Статус (для редактирования) */}
              {editOrder && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Статус</label>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(STATUS_LABELS).map(([key, val]) => (
                      <button
                        key={key}
                        onClick={() => changeOrderStatus(editOrder.id, key)}
                        className={`h-8 px-3 text-xs font-semibold rounded-lg transition-colors ${editOrder.status === key ? val.color + " ring-1 ring-current" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}
                      >
                        {val.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowOrderModal(false)} className="flex-1 h-10 bg-secondary text-foreground text-sm font-semibold rounded-lg hover:bg-secondary/80">
                Отмена
              </button>
              <button onClick={saveOrder} disabled={saving} className="flex-1 h-10 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-60">
                {saving ? "Сохранение..." : "Сохранить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
