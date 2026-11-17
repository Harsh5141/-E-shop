import { useEffect, useMemo, useState } from 'react';
import api, { API_ORIGIN } from '../config/api';
import { toast } from 'react-toastify';
import AdminAnalyticsPanel from '../components/admin/AdminAnalyticsPanel';
import {
  FolderPlus,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { resolveImageUrl } from '../utils/imageUrl';
import { formatINR } from '../utils/currency';

const emptyProduct = {
  name: '',
  description: '',
  price: '',
  stock: '',
  imageUrl: '',
  categoryId: '',
};

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('analytics');

  const [showProductForm, setShowProductForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingProductId, setEditingProductId] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [productForm, setProductForm] = useState(emptyProduct);

  const totalRevenue = useMemo(() => orders.reduce((sum, order) => sum + order.total, 0), [orders]);

  const resetProductForm = () => {
    setProductForm({
      ...emptyProduct,
      categoryId: categories.length > 0 ? String(categories[0].id) : '',
    });
    setEditingProductId(null);
    setImageFile(null);
    setShowProductForm(false);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [analyticsResult, ordersResult, productsResult, categoriesResult, usersResult] = await Promise.allSettled([
        api.get('/admin/analytics'),
        api.get('/orders/all'),
        api.get('/products', { params: { pageSize: 100 } }),
        api.get('/categories'),
        api.get('/users'),
      ]);

      const errors = [];

      const analyticsData = analyticsResult.status === 'fulfilled' ? analyticsResult.value.data : null;
      if (analyticsResult.status !== 'fulfilled') {
        errors.push('analytics');
      }

      const ordersData = ordersResult.status === 'fulfilled' && Array.isArray(ordersResult.value.data)
        ? ordersResult.value.data
        : [];
      if (ordersResult.status !== 'fulfilled') {
        errors.push('orders');
      }

      const productsData = productsResult.status === 'fulfilled'
        ? (productsResult.value.data.products || (Array.isArray(productsResult.value.data) ? productsResult.value.data : []))
        : [];
      if (productsResult.status !== 'fulfilled') {
        errors.push('products');
      }

      const categoryData = categoriesResult.status === 'fulfilled' && Array.isArray(categoriesResult.value.data)
        ? categoriesResult.value.data
        : [];
      if (categoriesResult.status !== 'fulfilled') {
        errors.push('categories');
      }

      const usersData = usersResult.status === 'fulfilled' && Array.isArray(usersResult.value.data)
        ? usersResult.value.data
        : [];
      if (usersResult.status !== 'fulfilled') {
        errors.push('users');
      }

      setAnalytics(analyticsData);
      setOrders(ordersData);
      setProducts(productsData);
      setCategories(categoryData);
      setUsers(usersData);

      if (!editingProductId) {
        setProductForm((prev) => ({
          ...prev,
          categoryId: prev.categoryId || (categoryData[0] ? String(categoryData[0].id) : ''),
        }));
      }

      if (errors.length > 0) {
        toast.error(`Some admin sections failed to load: ${errors.join(', ')}.`);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateProduct = () => {
    setEditingProductId(null);
    setProductForm({
      ...emptyProduct,
      categoryId: categories.length > 0 ? String(categories[0].id) : '',
    });
    setImageFile(null);
    setShowProductForm(true);
  };

  const openEditProduct = (product) => {
    setEditingProductId(product.id);
    setProductForm({
      name: product.name || '',
      description: product.description || '',
      price: String(product.price ?? ''),
      stock: String(product.stock ?? ''),
      imageUrl: product.imageUrl || '',
      categoryId: String(product.categoryId ?? product.category?.id ?? ''),
    });
    setImageFile(null);
    setShowProductForm(true);
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      if (editingCategoryId) {
        await api.put(`/categories/${editingCategoryId}`, { name: newCategoryName });
        toast.success('Category updated successfully.');
      } else {
        await api.post('/categories', { name: newCategoryName });
        toast.success('Category created successfully.');
      }

      setNewCategoryName('');
      setShowCategoryForm(false);
      setEditingCategoryId(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data || 'Failed to save category');
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategoryId(category.id);
    setNewCategoryName(category.name);
    setShowCategoryForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this category? All products associated with it will also be deleted.')) return;

    try {
      const res = await api.delete(`/categories/${id}`);
      toast.success(res.data?.message || 'Category deleted successfully.');
      if (editingCategoryId === id) {
        setEditingCategoryId(null);
        setNewCategoryName('');
        setShowCategoryForm(false);
      }
      fetchData();
    } catch (error) {
      toast.error(error.response?.data || 'Failed to delete category');
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();

    try {
      setUploadingImage(Boolean(imageFile));

      let finalImageUrl = productForm.imageUrl;
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        const uploadRes = await api.post('/products/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        finalImageUrl = `${API_ORIGIN}${uploadRes.data.url}`;
      }

      const payload = {
        ...productForm,
        imageUrl: finalImageUrl,
        price: parseFloat(productForm.price),
        stock: parseInt(productForm.stock, 10),
        categoryId: parseInt(productForm.categoryId, 10),
      };

      if (editingProductId) {
        await api.put(`/products/${editingProductId}`, payload);
        toast.success('Product updated successfully.');
      } else {
        await api.post('/products', payload);
        toast.success('Product added successfully.');
      }

      resetProductForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data || 'Failed to save product');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;

    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted successfully.');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data || 'Failed to delete product');
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await api.put(`/users/${userId}/role`, { role });
      toast.success('User role updated successfully.');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data || 'Failed to update role');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;

    try {
      await api.delete(`/users/${id}`);
      toast.success('User deleted successfully.');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data || 'Failed to delete user');
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      toast.success('Order status updated.');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data || 'Failed to update order status');
    }
  };

  const deleteOrder = async (orderId) => {
    if (!window.confirm('Delete this order? Stock will be restored for orders that were not delivered or already cancelled.')) return;

    try {
      await api.delete(`/orders/${orderId}`);
      toast.success('Order deleted successfully.');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data || 'Failed to delete order');
    }
  };

  if (loading) {
    return <div className="p-20 text-center text-slate-500">Loading admin dashboard...</div>;
  }

  return (
    <div className="mx-auto max-w-7xl pb-12">
      <div className="mb-10 overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-2xl">
        <div className="grid gap-8 px-8 py-10 lg:grid-cols-[1.4fr_0.8fr]">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Admin Dashboard</p>
            <h1 className="text-4xl font-black leading-tight sm:text-5xl">Manage your store from one control room.</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
              Review products, edit catalog entries, manage user access, handle categories, and track recent orders.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-400">Revenue</p>
              <h3 className="mt-3 text-3xl font-black">{formatINR(totalRevenue)}</h3>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-400">Orders</p>
              <h3 className="mt-3 text-3xl font-black">{orders.length}</h3>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-400">Products</p>
              <h3 className="mt-3 text-3xl font-black">{products.length}</h3>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-400">Users</p>
              <h3 className="mt-3 text-3xl font-black">{users.length}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 flex flex-wrap gap-3">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`rounded-xl px-5 py-3 font-semibold transition ${activeTab === 'analytics' ? 'bg-slate-950 text-white' : 'bg-white text-slate-600 shadow-sm'}`}
        >
          Analytics
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`rounded-xl px-5 py-3 font-semibold transition ${activeTab === 'products' ? 'bg-slate-950 text-white' : 'bg-white text-slate-600 shadow-sm'}`}
        >
          Product Management
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`rounded-xl px-5 py-3 font-semibold transition ${activeTab === 'users' ? 'bg-slate-950 text-white' : 'bg-white text-slate-600 shadow-sm'}`}
        >
          User Management
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`rounded-xl px-5 py-3 font-semibold transition ${activeTab === 'orders' ? 'bg-slate-950 text-white' : 'bg-white text-slate-600 shadow-sm'}`}
        >
          Order Management
        </button>
      </div>

      {activeTab === 'analytics' && <AdminAnalyticsPanel analytics={analytics} />}

      {activeTab === 'products' && (
        <div className={`grid gap-8 ${showProductForm ? 'xl:grid-cols-[1.15fr_0.85fr]' : ''}`}>
          <div className="space-y-8">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Products</h2>
                  <p className="text-sm text-slate-500">Create, edit, and remove products from the storefront.</p>
                </div>
                <button
                  onClick={openCreateProduct}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 font-semibold text-white transition hover:bg-cyan-500"
                >
                  <Plus size={18} />
                  Add Product
                </button>
              </div>

              <div className="space-y-4">
                {products.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
                    No products yet. Add your first product from the button above.
                  </p>
                ) : (
                  products.map((product) => (
                    <div key={product.id} className="flex flex-col gap-4 rounded-3xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-4">
                        <img
                          src={resolveImageUrl(product.imageUrl, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80')}
                          alt={product.name}
                          className="h-16 w-16 rounded-2xl object-cover"
                        />
                        <div>
                          <h3 className="font-bold text-slate-900">{product.name}</h3>
                          <p className="text-sm text-slate-500">{product.category?.name || 'Uncategorized'}</p>
                          <p className="mt-1 text-sm text-slate-700">{formatINR(product.price)} • Stock {product.stock}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => openEditProduct(product)}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          <Pencil size={16} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Categories</h2>
                  <p className="text-sm text-slate-500">Organize products with category management tools.</p>
                </div>
                <button
                  onClick={() => {
                    setShowCategoryForm((prev) => {
                      const next = !prev;
                      if (!next) {
                        setEditingCategoryId(null);
                        setNewCategoryName('');
                      }
                      return next;
                    });
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 font-semibold text-white transition hover:bg-slate-800"
                >
                  <FolderPlus size={18} />
                  {showCategoryForm ? 'Close Category Form' : 'Add Category'}
                </button>
              </div>

              {showCategoryForm && (
                <form onSubmit={handleAddCategory} className="mb-6 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 md:flex-row">
                  <input
                    type="text"
                    required
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Category name"
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500"
                  />
                  <button type="submit" className="rounded-xl bg-cyan-600 px-5 py-3 font-semibold text-white hover:bg-cyan-500">
                    {editingCategoryId ? 'Update Category' : 'Save Category'}
                  </button>
                </form>
              )}

              <div className="grid gap-3 md:grid-cols-2">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                    <div>
                      <p className="font-semibold text-slate-900">{category.name}</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Category #{category.id} • {category.productCount ?? 0} products
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditCategory(category)}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <Pencil size={16} />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(category.id)}
                        title="Delete category and its associated products"
                        className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-slate-500">
                Deleting a category will also delete all products associated with that category.
              </p>
            </section>
          </div>

          {showProductForm && (
          <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900">{editingProductId ? 'Edit Product' : 'Create Product'}</h2>
                <p className="text-sm text-slate-500">Use this form to manage storefront inventory.</p>
              </div>
              {showProductForm && (
                <button onClick={resetProductForm} className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200">
                  <X size={18} />
                </button>
              )}
            </div>

              <form onSubmit={handleSaveProduct} className="space-y-4">
                <input
                  type="text"
                  required
                  placeholder="Product name"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500"
                />
                <textarea
                  required
                  rows="4"
                  placeholder="Description"
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500"
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Price"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500"
                  />
                  <input
                    type="number"
                    required
                    placeholder="Stock"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500"
                  />
                </div>
                <select
                  required
                  value={productForm.categoryId}
                  onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-500"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                  {categories.length === 0 && <option value="">No categories available</option>}
                </select>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100">
                  <Upload size={18} />
                  <span>{imageFile ? imageFile.name : 'Upload Product Image'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files[0])} />
                </label>
                {!imageFile && (
                  <input
                    type="url"
                    placeholder="Or paste image URL"
                    value={productForm.imageUrl}
                    onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500"
                  />
                )}
                <button
                  type="submit"
                  disabled={categories.length === 0 || uploadingImage}
                  className="w-full rounded-xl bg-slate-950 px-4 py-3 font-bold text-white transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {uploadingImage ? 'Uploading image...' : editingProductId ? 'Update Product' : 'Create Product'}
                </button>
              </form>
          </aside>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-slate-900">Users</h2>
            <p className="text-sm text-slate-500">Promote users to admin or remove non-admin accounts.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-sm text-slate-500">
                  <th className="px-4">ID</th>
                  <th className="px-4">Name</th>
                  <th className="px-4">Email</th>
                  <th className="px-4">Role</th>
                  <th className="px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="rounded-2xl bg-slate-50 text-sm text-slate-700">
                    <td className="rounded-l-2xl px-4 py-4 font-mono">#{user.id}</td>
                    <td className="px-4 py-4 font-semibold">{user.name}</td>
                    <td className="px-4 py-4">{user.email}</td>
                    <td className="px-4 py-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-cyan-500"
                      >
                        <option value="User">User</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </td>
                    <td className="rounded-r-2xl px-4 py-4">
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={user.role === 'Admin'}
                        className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2 font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'orders' && (
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-slate-900">Recent Orders</h2>
            <p className="text-sm text-slate-500">Track order status and monitor recent purchases.</p>
          </div>
          <div className="space-y-4">
            {orders.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">No orders found yet.</p>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="rounded-3xl border border-slate-200 p-5">
                  <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Order #{order.id}</p>
                      <h3 className="mt-2 text-lg font-bold text-slate-900">{order.user?.name || `User ${order.userId}`}</h3>
                      <p className="text-sm text-slate-500">{new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-cyan-50 px-4 py-2 text-sm font-bold text-cyan-700">{formatINR(order.total)}</span>
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-cyan-500"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => deleteOrder(order.id)}
                        className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                      >
                        <Trash2 size={16} />
                        Delete Order
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4 rounded-2xl bg-slate-50 p-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Shipping</p>
                      <p className="mt-2 text-sm text-slate-700">{order.shippingAddress || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Payment</p>
                      <p className="mt-2 text-sm font-semibold text-slate-700">{order.paymentMethod || 'Cash on Delivery'}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default AdminDashboard;
