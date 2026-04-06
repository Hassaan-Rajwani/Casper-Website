import { Fragment, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard, Package, ShoppingBag, Plus, Pencil, Trash2, 
  X, Save, TrendingUp, AlertCircle, Search, ChevronDown, ChevronUp,
  Leaf, Eye, EyeOff, LogOut, Lock, Upload
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  createAdminCategory,
  createAdminProduct,
  deleteAdminCategory,
  deleteAdminProduct,
  getCurrentAdminUser,
  getAdminStats,
  listCategories,
  listAdminOrders,
  listAdminProducts,
  loginAdmin,
  logoutAdmin,
  updateAdminOrder,
  updateAdminProduct,
  updateAdminOrderStatus,
} from "@/lib/firebase-store";
import type { AdminStats as Stats, Order, Product } from "@/lib/store-types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";

const SESSION_KEY = "softtouch_admin_auth";

type DeleteTarget =
  | { type: "product"; product: Product }
  | { type: "category"; categoryId: string; categoryName: string; linkedProductsCount: number };

function getOrderStatusBadgeClass(status: string) {
  if (status === "cancelled") {
    return "bg-red-100 text-red-700";
  }

  if (status === "delivered") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "pending") {
    return "bg-amber-100 text-amber-700";
  }

  if (status === "confirmed") {
    return "bg-blue-100 text-blue-700";
  }

  return "bg-slate-100 text-slate-700";
}

function AdminLogin({
  onLogin,
  onExitToStore,
}: {
  onLogin: (email: string, password: string) => Promise<void>;
  onExitToStore: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await onLogin(email, password);
      sessionStorage.setItem(SESSION_KEY, "true");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to sign in. Please verify your credentials and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/25">
            <Leaf className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Admin Login</h1>
          <p className="text-muted-foreground text-sm mt-1">Casper Management Panel</p>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@casper.com"
                className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-muted/50 border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-xl"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Lock className="w-4 h-4" /> Login to Admin</>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-border">
            <a
              href="/"
              onClick={(event) => {
                event.preventDefault();
                onExitToStore();
              }}
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              ← Back to Store
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

const emptyForm = {
  name: "", description: "", price: "", originalPrice: "", imageUrl: "",
  category: "facial", stock: "100", rating: "4.5", reviewCount: "0",
  isNew: false, isBestseller: false,
};

const emptyOrderRepairForm = {
  orderNumber: "",
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  address: "",
  city: "",
  postalCode: "",
  paymentMethod: "cod",
  total: "",
  createdAt: "",
};

function formatCurrency(value: unknown) {
  const amount =
    typeof value === "number" && Number.isFinite(value)
      ? value
      : typeof value === "string"
        ? Number(value)
        : 0;

  return Number.isFinite(amount) ? amount.toFixed(0) : "0";
}

export default function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === "true" || Boolean(getCurrentAdminUser()),
  );
  const [tab, setTab] = useState<"dashboard" | "products" | "categories" | "orders">("dashboard");
  const [orderView, setOrderView] = useState<"all" | "active" | "completed" | "cancelled">("active");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [orderRepairForm, setOrderRepairForm] = useState(emptyOrderRepairForm);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isReadingImage, setIsReadingImage] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: stats } = useQuery<Stats>({
    queryKey: ["admin-stats"],
    queryFn: () => getAdminStats(),
    enabled: isLoggedIn,
  });
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["admin-products"],
    queryFn: () => listAdminProducts(),
    enabled: isLoggedIn,
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => listCategories(),
    enabled: isLoggedIn,
  });
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["admin-orders"],
    queryFn: () => listAdminOrders(),
    enabled: isLoggedIn,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["admin-stats"] });
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
    qc.invalidateQueries({ queryKey: ["categories"] });
  };

  const createMutation = useMutation({
    mutationFn: (data: Omit<Product, "id">) => createAdminProduct(data),
    onSuccess: () => { toast({ title: "Product added!" }); invalidate(); closeForm(); },
    onError: (error) =>
      toast({
        title: "Failed to add product",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      }),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Omit<Product, "id">> }) =>
      updateAdminProduct(id, data),
    onSuccess: () => { toast({ title: "Product updated!" }); invalidate(); closeForm(); },
    onError: (error) =>
      toast({
        title: "Failed to update product",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      }),
  });
  const createCategoryMutation = useMutation({
    mutationFn: (name: string) => createAdminCategory({ name, icon: "leaf" }),
    onSuccess: (category) => {
      toast({ title: "Category added!" });
      invalidate();
      setNewCategoryName("");
      setForm((current) => ({ ...current, category: category.id }));
    },
    onError: (error) =>
      toast({
        title: "Failed to add category",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteAdminProduct(id),
    onSuccess: () => {
      toast({ title: "Product deleted" });
      invalidate();
      setDeletingProductId(null);
    },
    onError: (error) =>
      toast({
        title: "Failed to delete",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      }),
    onSettled: () => {
      setDeletingProductId(null);
    },
  });
  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => deleteAdminCategory(id),
    onSuccess: () => {
      toast({ title: "Category deleted" });
      invalidate();
      setDeleteTarget(null);
    },
    onError: (error) =>
      toast({
        title: "Failed to delete category",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      }),
    onSettled: () => {
      setDeleteTarget(null);
    },
  });
  const cancelOrderMutation = useMutation({
    mutationFn: (orderId: string) => updateAdminOrderStatus(orderId, "cancelled"),
    onSuccess: () => {
      toast({ title: "Order cancelled" });
      invalidate();
      setOrderToCancel(null);
    },
    onError: (error) =>
      toast({
        title: "Failed to cancel order",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      }),
  });
  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: Order["status"] }) =>
      updateAdminOrderStatus(orderId, status),
    onSuccess: (_, variables) => {
      toast({
        title: variables.status === "delivered" ? "Order delivered" : "Order confirmed",
      });
      invalidate();
    },
    onError: (error) =>
      toast({
        title: "Failed to update order",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      }),
  });
  const updateOrderMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Order> }) => updateAdminOrder(id, data),
    onSuccess: () => {
      toast({ title: "Order details updated" });
      invalidate();
      setEditingOrderId(null);
      setOrderRepairForm(emptyOrderRepairForm);
    },
    onError: (error) =>
      toast({
        title: "Failed to update order",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      }),
  });

  const handleAdminLogin = async (email: string, password: string) => {
    await loginAdmin(email, password);
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    await logoutAdmin();
    sessionStorage.removeItem(SESSION_KEY);
    setIsLoggedIn(false);
  };
  const handleExitToStore = () => {
    void handleLogout();
    window.location.href = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/`;
  };

  const adminIdentity =
    getCurrentAdminUser()?.email || import.meta.env.VITE_ADMIN_EMAIL || "Admin";

  if (!isLoggedIn) {
    return <AdminLogin onLogin={handleAdminLogin} onExitToStore={handleExitToStore} />;
  }

  const openAdd = () => {
    setForm({
      ...emptyForm,
      category: categories[0]?.id ?? emptyForm.category,
    });
    setEditProduct(null);
    setNewCategoryName("");
    setShowForm(true);
  };
  const openEdit = (p: Product) => {
    setEditProduct(p);
    setForm({
      name: p.name, description: p.description, price: p.price.toString(),
      originalPrice: p.originalPrice?.toString() || "", imageUrl: p.imageUrl,
      category: p.category, stock: p.stock.toString(), rating: p.rating.toString(),
      reviewCount: p.reviewCount.toString(), isNew: p.isNew, isBestseller: p.isBestseller,
    });
    setNewCategoryName("");
    setShowForm(true);
  };
  const closeForm = () => {
    setShowForm(false);
    setEditProduct(null);
    setNewCategoryName("");
    setIsReadingImage(false);
    setForm(emptyForm);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please select an image file.",
        variant: "destructive",
      });
      event.target.value = "";
      return;
    }

    setIsReadingImage(true);

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(new Error("Image upload failed"));
        reader.readAsDataURL(file);
      });

      setForm((current) => ({ ...current, imageUrl: dataUrl }));
      toast({ title: "Image uploaded", description: file.name });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "The selected image could not be read.",
        variant: "destructive",
      });
    } finally {
      setIsReadingImage(false);
      event.target.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: form.name, description: form.description, price: parseFloat(form.price),
      originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : null,
      imageUrl: form.imageUrl, category: form.category, stock: parseInt(form.stock),
      rating: parseFloat(form.rating), reviewCount: parseInt(form.reviewCount),
      isNew: form.isNew, isBestseller: form.isBestseller,
    };
    if (editProduct) updateMutation.mutate({ id: editProduct.id, data });
    else createMutation.mutate(data);
  };

  const handleAddCategory = () => {
    const normalizedName = newCategoryName.trim();
    if (!normalizedName) {
      toast({
        title: "Category name required",
        description: "Enter a category name before adding it.",
        variant: "destructive",
      });
      return;
    }

    createCategoryMutation.mutate(normalizedName);
  };

  const handleDeleteCategory = (categoryId: string, categoryName: string) => {
    const linkedProductsCount = products.filter((product) => product.category === categoryId).length;
    if (linkedProductsCount > 0) {
      toast({
        title: "Category is in use",
        description: `This category is assigned to ${linkedProductsCount} product${linkedProductsCount === 1 ? "" : "s"}. Reassign those products before deleting it.`,
        variant: "destructive",
      });
      return;
    }

    setDeleteTarget({ type: "category", categoryId, categoryName, linkedProductsCount });
  };
  const openOrderRepair = (order: Order) => {
    setExpandedOrderId(order.id);
    setEditingOrderId(order.id);
    setOrderRepairForm({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      address: order.address,
      city: order.city,
      postalCode: order.postalCode,
      paymentMethod: order.paymentMethod || "cod",
      total: order.total > 0 ? String(order.total) : "",
      createdAt:
        order.createdAt && order.createdAt !== new Date(0).toISOString()
          ? order.createdAt.slice(0, 16)
          : "",
    });
  };
  const handleOrderRepairSubmit = (orderId: string) => {
    updateOrderMutation.mutate({
      id: orderId,
      data: {
        orderNumber: orderRepairForm.orderNumber.trim(),
        customerName: orderRepairForm.customerName.trim(),
        customerEmail: orderRepairForm.customerEmail.trim(),
        customerPhone: orderRepairForm.customerPhone.trim(),
        address: orderRepairForm.address.trim(),
        city: orderRepairForm.city.trim(),
        postalCode: orderRepairForm.postalCode.trim(),
        paymentMethod: orderRepairForm.paymentMethod.trim() || "cod",
        total: Number(orderRepairForm.total || 0),
        createdAt: orderRepairForm.createdAt
          ? new Date(orderRepairForm.createdAt).toISOString()
          : new Date().toISOString(),
      },
    });
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );
  const visibleOrders = orders.filter((order) => order.status !== "cancelled");
  const normalizedOrderSearch = orderSearch.trim().toLowerCase();
  const filteredOrders = orders.filter((order) => {
    if (orderView === "active" && !["pending", "confirmed"].includes(order.status)) {
      return false;
    }

    if (orderView === "completed" && order.status !== "delivered") {
      return false;
    }

    if (orderView === "cancelled" && order.status !== "cancelled") {
      return false;
    }

    if (!normalizedOrderSearch) {
      return orderView === "all" ? true : true;
    }

    return [
      order.orderNumber,
      order.customerName,
      order.customerEmail,
      order.customerPhone,
      order.city,
      order.status,
      order.paymentMethod,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedOrderSearch));
  });
  const visibleStats = {
    totalOrders: visibleOrders.length,
    totalRevenue:
      Math.round(visibleOrders.reduce((sum, order) => sum + Number(order.total || 0), 0) * 100) /
      100,
    pendingOrders: visibleOrders.filter((order) => order.status === "pending").length,
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-foreground">Admin Panel</h1>
            <p className="text-xs text-muted-foreground">Casper Management</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            {adminIdentity}
          </div>
          <a
            href="/"
            onClick={(event) => {
              event.preventDefault();
              handleExitToStore();
            }}
            className="text-sm text-muted-foreground hover:text-primary transition-colors hidden sm:block"
          >
            ← Store
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-56 min-h-[calc(100vh-65px)] bg-background border-r border-border p-4 hidden md:block">
          <nav className="space-y-1">
            {[
              { id: "dashboard", icon: TrendingUp, label: "Dashboard" },
              { id: "products", icon: Package, label: "Products" },
              { id: "categories", icon: Leaf, label: "Categories" },
              { id: "orders", icon: ShoppingBag, label: "Orders" },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  tab === item.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile tabs */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border flex">
          {[
            { id: "dashboard", icon: TrendingUp, label: "Dashboard" },
            { id: "products", icon: Package, label: "Products" },
            { id: "categories", icon: Leaf, label: "Categories" },
            { id: "orders", icon: ShoppingBag, label: "Orders" },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id as any)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                tab === item.id ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Main */}
        <main className="flex-1 p-6 pb-24 md:pb-6">

          {/* Dashboard */}
          {tab === "dashboard" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="text-2xl font-bold text-foreground mb-6">Dashboard</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Total Products", value: stats?.totalProducts ?? 0, icon: Package, color: "bg-blue-100 text-blue-600" },
                  { label: "Total Orders", value: visibleStats.totalOrders, icon: ShoppingBag, color: "bg-green-100 text-green-600" },
                  { label: "Total Revenue", value: `Rs. ${visibleStats.totalRevenue.toFixed(0)}`, icon: TrendingUp, color: "bg-purple-100 text-purple-600" },
                  { label: "Pending Orders", value: visibleStats.pendingOrders, icon: AlertCircle, color: "bg-orange-100 text-orange-600" },
                ].map((stat, i) => (
                  <div key={i} className="bg-card rounded-2xl border border-border p-5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
              <div className="bg-card rounded-2xl border border-border p-5">
                <h3 className="font-semibold text-foreground mb-4">Recent Orders</h3>
                {visibleOrders.slice(0, 5).length === 0 ? (
                  <p className="text-muted-foreground text-sm">No orders yet.</p>
                ) : (
                  <div className="space-y-3">
                    {visibleOrders.slice(0, 5).map(order => (
                      <div key={order.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                        <div>
                          <p className="font-medium text-sm text-foreground">{order.orderNumber}</p>
                          <p className="text-xs text-muted-foreground">{order.customerName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm text-foreground">Rs. {formatCurrency(order.total)}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${getOrderStatusBadgeClass(order.status)}`}>{order.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Products */}
          {tab === "products" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Products</h2>
                <button
                  onClick={openAdd}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-4 h-4" /> Add Product
                </button>
              </div>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-border focus:outline-none focus:border-primary text-sm"
                />
              </div>

              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 text-muted-foreground text-xs uppercase tracking-wider">
                    <tr>
                      <th className="text-left px-4 py-3">Product</th>
                      <th className="text-left px-4 py-3 hidden sm:table-cell">Category</th>
                      <th className="text-left px-4 py-3">Price</th>
                      <th className="text-left px-4 py-3 hidden md:table-cell">Stock</th>
                      <th className="text-right px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filtered.map(product => (
                      <tr key={product.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img src={product.imageUrl} alt={product.name} className="w-10 h-10 rounded-lg object-cover bg-muted flex-shrink-0" />
                            <span className="font-medium text-foreground line-clamp-1">{product.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full capitalize">{product.category}</span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-foreground">
                          Rs. {product.price}
                          {product.originalPrice && <span className="text-xs text-muted-foreground line-through ml-1">Rs. {product.originalPrice}</span>}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className={`text-xs font-medium ${product.stock < 20 ? "text-destructive" : "text-green-600"}`}>
                            {product.stock} units
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openEdit(product)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget({ type: "product", product })}
                              disabled={deletingProductId === product.id}
                              className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            >
                              {deletingProductId === product.id ? (
                                <Spinner className="w-4 h-4" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No products found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Categories */}
          {tab === "categories" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex flex-col gap-2 mb-6">
                <h2 className="text-2xl font-bold text-foreground">Categories</h2>
                <p className="text-sm text-muted-foreground">
                  Manage the categories used across the storefront and product forms.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Add a Category</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Newly added categories will appear in the product form dropdown automatically.
                    </p>
                  </div>
                  <div className="flex w-full max-w-xl gap-2">
                    <input
                      value={newCategoryName}
                      disabled={createCategoryMutation.isPending}
                      onChange={e => setNewCategoryName(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-background border border-border focus:outline-none focus:border-primary text-sm"
                      placeholder="Category name"
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      disabled={createCategoryMutation.isPending}
                      className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
                    >
                      {createCategoryMutation.isPending ? "Adding..." : "Add Category"}
                    </button>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="rounded-2xl border border-border bg-muted/20 px-4 py-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Leaf className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground">{category.name}</p>
                            <p className="text-xs text-muted-foreground">{category.id}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {products.filter((product) => product.category === category.id).length} linked product{products.filter((product) => product.category === category.id).length === 1 ? "" : "s"}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(category.id, category.name)}
                          disabled={deleteCategoryMutation.isPending}
                          className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 transition-colors disabled:opacity-60"
                        >
                          {deleteCategoryMutation.isPending && deleteCategoryMutation.variables === category.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Orders */}
          {tab === "orders" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex flex-col gap-2 mb-6">
                <h2 className="text-2xl font-bold text-foreground">Orders</h2>
                <p className="text-sm text-muted-foreground">
                  Keep active orders separate from completed ones, while still retaining full history.
                </p>
              </div>
              <div className="mb-4 flex flex-col gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    value={orderSearch}
                    onChange={e => setOrderSearch(e.target.value)}
                    placeholder="Search by order #, customer, phone, city, status..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-border focus:outline-none focus:border-primary text-sm"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "active", label: "Active Orders" },
                    { id: "completed", label: "Completed" },
                    { id: "cancelled", label: "Cancelled" },
                    { id: "all", label: "All Orders" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setOrderView(item.id as typeof orderView)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                        orderView === item.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-background border border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 text-muted-foreground text-xs uppercase tracking-wider">
                    <tr>
                      <th className="text-left px-4 py-3">Order #</th>
                      <th className="text-left px-4 py-3 hidden sm:table-cell">Customer</th>
                      <th className="text-left px-4 py-3 hidden md:table-cell">City</th>
                      <th className="text-left px-4 py-3">Total</th>
                      <th className="text-left px-4 py-3 hidden sm:table-cell">Payment</th>
                      <th className="text-left px-4 py-3">Status</th>
                      <th className="text-right px-4 py-3">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filteredOrders.map(order => {
                      const isExpanded = expandedOrderId === order.id;

                      return (
                        <Fragment key={order.id}>
                          <tr className="hover:bg-muted/20 transition-colors align-top">
                            <td className="px-4 py-3 font-mono text-xs text-foreground">
                              <div className="space-y-1">
                                <p>{order.orderNumber}</p>
                                <p className="text-[11px] text-muted-foreground sm:hidden">
                                  {order.customerName}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-3 hidden sm:table-cell">
                              <div>
                                <p className="font-medium text-foreground">{order.customerName}</p>
                                <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                                <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{order.city}</td>
                            <td className="px-4 py-3 font-semibold text-foreground">Rs. {formatCurrency(order.total)}</td>
                            <td className="px-4 py-3 hidden sm:table-cell">
                              <span className="capitalize text-muted-foreground text-xs">
                                {order.paymentMethod === "cod" ? "Cash on Delivery" : "Card"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${getOrderStatusBadgeClass(order.status)}`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {order.status === "pending" ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateOrderStatusMutation.mutate({
                                        orderId: order.id,
                                        status: "confirmed",
                                      })
                                    }
                                    disabled={updateOrderStatusMutation.isPending || cancelOrderMutation.isPending}
                                    className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50 transition-colors disabled:opacity-60"
                                  >
                                    {updateOrderStatusMutation.isPending &&
                                    updateOrderStatusMutation.variables?.orderId === order.id &&
                                    updateOrderStatusMutation.variables?.status === "confirmed" ? (
                                      <Spinner className="w-4 h-4" />
                                    ) : null}
                                    Mark Confirmed
                                  </button>
                                ) : null}
                                {order.status !== "cancelled" && order.status !== "delivered" ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateOrderStatusMutation.mutate({
                                        orderId: order.id,
                                        status: "delivered",
                                      })
                                    }
                                    disabled={updateOrderStatusMutation.isPending || cancelOrderMutation.isPending}
                                    className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-60"
                                  >
                                    {updateOrderStatusMutation.isPending &&
                                    updateOrderStatusMutation.variables?.orderId === order.id &&
                                    updateOrderStatusMutation.variables?.status === "delivered" ? (
                                      <Spinner className="w-4 h-4" />
                                    ) : null}
                                    Mark Delivered
                                  </button>
                                ) : null}
                                {order.status !== "cancelled" && order.status !== "delivered" ? (
                                  <button
                                    type="button"
                                    onClick={() => setOrderToCancel(order)}
                                    disabled={cancelOrderMutation.isPending || updateOrderStatusMutation.isPending}
                                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 transition-colors disabled:opacity-60"
                                  >
                                    {cancelOrderMutation.isPending && cancelOrderMutation.variables === order.id ? (
                                      <Spinner className="w-4 h-4" />
                                    ) : null}
                                    Cancel Order
                                  </button>
                                ) : null}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedOrderId((current) =>
                                      current === order.id ? null : order.id,
                                    )
                                  }
                                  className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                                >
                                  {isExpanded ? "Hide" : "View"}
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr className="bg-muted/20">
                              <td colSpan={7} className="px-4 py-5">
                                <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-6">
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between gap-3">
                                      <h3 className="text-sm font-semibold text-foreground">
                                        Ordered Products
                                      </h3>
                                      <p className="text-xs text-muted-foreground">
                                        {order.items.length} item{order.items.length === 1 ? "" : "s"}
                                      </p>
                                    </div>

                                    <div className="space-y-3">
                                      {order.items.map((item) => (
                                        <div
                                          key={`${order.id}-${item.productId}`}
                                          className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-3"
                                        >
                                          <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted border border-border shrink-0">
                                              {item.productImageUrl ? (
                                                <img
                                                  src={item.productImageUrl}
                                                  alt={item.productName}
                                                  className="w-full h-full object-cover"
                                                />
                                              ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground text-center px-1">
                                                  No image
                                                </div>
                                              )}
                                            </div>
                                            <div className="min-w-0">
                                              <p className="font-medium text-foreground truncate">
                                                {item.productName}
                                              </p>
                                              <p className="text-xs text-muted-foreground">
                                                Product ID: {item.productId}
                                              </p>
                                              <p className="text-xs text-muted-foreground">
                                                Qty: {item.quantity}
                                              </p>
                                            </div>
                                          </div>

                                          <div className="text-right shrink-0">
                                            <p className="font-semibold text-foreground">
                                              Rs. {formatCurrency(item.price * item.quantity)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              Rs. {formatCurrency(item.price)} each
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="rounded-2xl border border-border bg-background p-4 space-y-4">
                                    <div className="flex items-start justify-between gap-3">
                                      <div>
                                        <h3 className="text-sm font-semibold text-foreground">
                                          Customer Details
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          {new Date(order.createdAt).toLocaleString()}
                                        </p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => openOrderRepair(order)}
                                        className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                                      >
                                        Edit Details
                                      </button>
                                    </div>

                                    {editingOrderId === order.id ? (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <input
                                          value={orderRepairForm.orderNumber}
                                          onChange={(e) => setOrderRepairForm((current) => ({ ...current, orderNumber: e.target.value }))}
                                          placeholder="Order number"
                                          className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm focus:outline-none focus:border-primary"
                                        />
                                        <input
                                          value={orderRepairForm.customerName}
                                          onChange={(e) => setOrderRepairForm((current) => ({ ...current, customerName: e.target.value }))}
                                          placeholder="Customer name"
                                          className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm focus:outline-none focus:border-primary"
                                        />
                                        <input
                                          value={orderRepairForm.customerPhone}
                                          onChange={(e) => setOrderRepairForm((current) => ({ ...current, customerPhone: e.target.value }))}
                                          placeholder="Phone number"
                                          className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm focus:outline-none focus:border-primary"
                                        />
                                        <input
                                          value={orderRepairForm.customerEmail}
                                          onChange={(e) => setOrderRepairForm((current) => ({ ...current, customerEmail: e.target.value }))}
                                          placeholder="Email address"
                                          className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm focus:outline-none focus:border-primary"
                                        />
                                        <input
                                          value={orderRepairForm.city}
                                          onChange={(e) => setOrderRepairForm((current) => ({ ...current, city: e.target.value }))}
                                          placeholder="City"
                                          className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm focus:outline-none focus:border-primary"
                                        />
                                        <input
                                          value={orderRepairForm.postalCode}
                                          onChange={(e) => setOrderRepairForm((current) => ({ ...current, postalCode: e.target.value }))}
                                          placeholder="Postal code"
                                          className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm focus:outline-none focus:border-primary"
                                        />
                                        <input
                                          value={orderRepairForm.paymentMethod}
                                          onChange={(e) => setOrderRepairForm((current) => ({ ...current, paymentMethod: e.target.value }))}
                                          placeholder="Payment method"
                                          className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm focus:outline-none focus:border-primary"
                                        />
                                        <input
                                          value={orderRepairForm.total}
                                          onChange={(e) => setOrderRepairForm((current) => ({ ...current, total: e.target.value }))}
                                          placeholder="Order total"
                                          className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm focus:outline-none focus:border-primary"
                                        />
                                        <input
                                          type="datetime-local"
                                          value={orderRepairForm.createdAt}
                                          onChange={(e) => setOrderRepairForm((current) => ({ ...current, createdAt: e.target.value }))}
                                          className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm focus:outline-none focus:border-primary sm:col-span-2"
                                        />
                                        <textarea
                                          value={orderRepairForm.address}
                                          onChange={(e) => setOrderRepairForm((current) => ({ ...current, address: e.target.value }))}
                                          placeholder="Street address"
                                          rows={3}
                                          className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm focus:outline-none focus:border-primary sm:col-span-2"
                                        />
                                        <div className="sm:col-span-2 flex items-center justify-end gap-2">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEditingOrderId(null);
                                              setOrderRepairForm(emptyOrderRepairForm);
                                            }}
                                            className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                                          >
                                            Cancel
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleOrderRepairSubmit(order.id)}
                                            disabled={updateOrderMutation.isPending}
                                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-60"
                                          >
                                            {updateOrderMutation.isPending ? <Spinner className="w-4 h-4" /> : null}
                                            Save Details
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="rounded-xl bg-muted/40 p-3">
                                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                            Name
                                          </p>
                                          <p className="text-sm font-medium text-foreground mt-1">
                                            {order.customerName}
                                          </p>
                                        </div>
                                        <div className="rounded-xl bg-muted/40 p-3">
                                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                            Phone
                                          </p>
                                          <p className="text-sm font-medium text-foreground mt-1 break-all">
                                            {order.customerPhone}
                                          </p>
                                        </div>
                                        <div className="rounded-xl bg-muted/40 p-3 sm:col-span-2">
                                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                            Email
                                          </p>
                                          <p className="text-sm font-medium text-foreground mt-1 break-all">
                                            {order.customerEmail}
                                          </p>
                                        </div>
                                        <div className="rounded-xl bg-muted/40 p-3 sm:col-span-2">
                                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                            Street Address
                                          </p>
                                          <p className="text-sm font-medium text-foreground mt-1">
                                            {order.address}
                                          </p>
                                        </div>
                                        <div className="rounded-xl bg-muted/40 p-3">
                                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                            City
                                          </p>
                                          <p className="text-sm font-medium text-foreground mt-1">
                                            {order.city}
                                          </p>
                                        </div>
                                        <div className="rounded-xl bg-muted/40 p-3">
                                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                            ZIP / Postal Code
                                          </p>
                                          <p className="text-sm font-medium text-foreground mt-1">
                                            {order.postalCode}
                                          </p>
                                        </div>
                                        <div className="rounded-xl bg-muted/40 p-3">
                                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                            Payment
                                          </p>
                                          <p className="text-sm font-medium text-foreground mt-1">
                                            {order.paymentMethod === "cod" ? "Cash on Delivery" : "Card"}
                                          </p>
                                        </div>
                                        <div className="rounded-xl bg-muted/40 p-3">
                                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                            Order Total
                                          </p>
                                          <p className="text-sm font-semibold text-foreground mt-1">
                                            Rs. {formatCurrency(order.total)}
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                    {filteredOrders.length === 0 && (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No matching orders found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </main>
      </div>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending && !deleteCategoryMutation.isPending) {
            setDeleteTarget(null);
          }
        }}
      >
        <AlertDialogContent className="sm:max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTarget?.type === "category" ? "Delete this category?" : "Delete this product?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === "category"
                ? `Category ${deleteTarget.categoryName} will be removed from the admin catalog. This action cannot be undone.`
                : deleteTarget?.type === "product"
                  ? `${deleteTarget.product.name} will be permanently removed from the catalog. This action cannot be undone.`
                  : "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteTarget?.type === "product" ? (
            <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Category</span>
                <span className="capitalize text-foreground">{deleteTarget.product.category}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Price</span>
                <span className="font-semibold text-foreground">
                  Rs. {formatCurrency(deleteTarget.product.price)}
                </span>
              </div>
            </div>
          ) : null}
          {deleteTarget?.type === "category" ? (
            <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Category ID</span>
                <span className="text-foreground">{deleteTarget.categoryId}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Linked Products</span>
                <span className="font-semibold text-foreground">
                  {deleteTarget.linkedProductsCount}
                </span>
              </div>
            </div>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleteMutation.isPending || deleteCategoryMutation.isPending}
            >
              Keep It
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={!deleteTarget || deleteMutation.isPending || deleteCategoryMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                if (!deleteTarget) {
                  return;
                }

                if (deleteTarget.type === "product") {
                  setDeletingProductId(deleteTarget.product.id);
                  deleteMutation.mutate(deleteTarget.product.id);
                  return;
                }

                deleteCategoryMutation.mutate(deleteTarget.categoryId);
              }}
            >
              {deleteMutation.isPending || deleteCategoryMutation.isPending ? (
                <Spinner className="w-4 h-4" />
              ) : null}
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(orderToCancel)}
        onOpenChange={(open) => {
          if (!open && !cancelOrderMutation.isPending) {
            setOrderToCancel(null);
          }
        }}
      >
        <AlertDialogContent className="sm:max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
            <AlertDialogDescription>
              {orderToCancel
                ? `Order ${orderToCancel.orderNumber} for ${orderToCancel.customerName} will be marked as cancelled. This action updates the admin order status immediately.`
                : "This action updates the admin order status immediately."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {orderToCancel ? (
            <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Order Total</span>
                <span className="font-semibold text-foreground">
                  Rs. {formatCurrency(orderToCancel.total)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Status</span>
                <span className="capitalize text-foreground">{orderToCancel.status}</span>
              </div>
            </div>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelOrderMutation.isPending}>Keep Order</AlertDialogCancel>
            <AlertDialogAction
              disabled={!orderToCancel || cancelOrderMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                if (!orderToCancel) {
                  return;
                }
                cancelOrderMutation.mutate(orderToCancel.id);
              }}
            >
              {cancelOrderMutation.isPending ? <Spinner className="w-4 h-4" /> : null}
              Confirm Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Product Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && closeForm()}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-background rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h3 className="text-xl font-bold text-foreground">
                  {editProduct ? "Edit Product" : "Add New Product"}
                </h3>
                <button onClick={closeForm} className="p-2 rounded-lg hover:bg-muted transition-colors">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1">Product Name *</label>
                    <input
                      required value={form.name}
                      disabled={createMutation.isPending || updateMutation.isPending}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border focus:outline-none focus:border-primary text-sm"
                      placeholder="Casper Premium Facial Tissue"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1">Description *</label>
                    <textarea
                      required value={form.description}
                      disabled={createMutation.isPending || updateMutation.isPending}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border focus:outline-none focus:border-primary text-sm resize-none"
                      placeholder="Product description..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Price (Rs.) *</label>
                    <input
                      required type="number" value={form.price}
                      disabled={createMutation.isPending || updateMutation.isPending}
                      onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border focus:outline-none focus:border-primary text-sm"
                      placeholder="299"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Original Price (Rs.)</label>
                    <input
                      type="number" value={form.originalPrice}
                      disabled={createMutation.isPending || updateMutation.isPending}
                      onChange={e => setForm(f => ({ ...f, originalPrice: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border focus:outline-none focus:border-primary text-sm"
                      placeholder="399 (optional)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Category *</label>
                    <select
                      value={form.category}
                      disabled={createMutation.isPending || updateMutation.isPending}
                      onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border focus:outline-none focus:border-primary text-sm"
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Stock</label>
                    <input
                      type="number" value={form.stock}
                      disabled={createMutation.isPending || updateMutation.isPending}
                      onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border focus:outline-none focus:border-primary text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1">Product Photo *</label>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                      <div className="rounded-2xl border border-border bg-muted/20 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">Upload or paste image</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Paste an image URL or upload a file from your device.
                            </p>
                          </div>
                          {form.imageUrl ? (
                            <button
                              type="button"
                              onClick={() => setForm(f => ({ ...f, imageUrl: "" }))}
                              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-background transition-colors"
                            >
                              Remove
                            </button>
                          ) : null}
                        </div>
                        <input
                          required value={form.imageUrl}
                          disabled={createMutation.isPending || updateMutation.isPending}
                          onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                          className="mt-4 w-full px-4 py-2.5 rounded-xl bg-background border border-border focus:outline-none focus:border-primary text-sm"
                          placeholder="https://... or uploaded image data"
                        />
                        <label className="mt-3 flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background px-4 py-6 text-center transition-colors hover:border-primary/40 hover:bg-primary/5">
                          <Upload className="h-5 w-5 text-primary" />
                          <span className="mt-3 text-sm font-semibold text-foreground">
                            {isReadingImage ? "Uploading image..." : "Click to upload image"}
                          </span>
                          <span className="mt-1 text-xs text-muted-foreground">
                            JPG, PNG, WebP supported
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={isReadingImage || createMutation.isPending || updateMutation.isPending}
                            onChange={handleImageUpload}
                            className="sr-only"
                          />
                        </label>
                      </div>
                      <div className="rounded-2xl border border-border bg-card p-4">
                        <p className="text-sm font-semibold text-foreground">Preview</p>
                        <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-muted/20">
                          {form.imageUrl ? (
                            <img
                              src={form.imageUrl}
                              alt="Product preview"
                              className="h-56 w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-56 items-center justify-center px-6 text-center text-sm text-muted-foreground">
                              The uploaded or pasted image will appear here.
                            </div>
                          )}
                        </div>
                        <p className="mt-3 text-xs text-muted-foreground">
                          For best results, use a square or portrait-oriented product image.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox" checked={form.isNew}
                        disabled={createMutation.isPending || updateMutation.isPending}
                        onChange={e => setForm(f => ({ ...f, isNew: e.target.checked }))}
                        className="w-4 h-4 accent-primary"
                      />
                      <span className="text-sm font-medium text-foreground">Mark as New</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox" checked={form.isBestseller}
                        disabled={createMutation.isPending || updateMutation.isPending}
                        onChange={e => setForm(f => ({ ...f, isBestseller: e.target.checked }))}
                        className="w-4 h-4 accent-primary"
                      />
                      <span className="text-sm font-medium text-foreground">Bestseller</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeForm}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1 py-3 rounded-xl border border-border text-muted-foreground font-medium hover:bg-muted transition-colors text-sm">
                    Cancel
                  </button>
                  <button type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
                    {createMutation.isPending || updateMutation.isPending ? (
                      <>
                        <Spinner className="w-4 h-4" />
                        {editProduct ? "Updating..." : "Adding..."}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {editProduct ? "Update Product" : "Add Product"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
