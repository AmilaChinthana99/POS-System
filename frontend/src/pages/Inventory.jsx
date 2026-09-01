import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';
import Modal from '../components/common/Modal';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Search,
  Download,
  AlertTriangle,
  SlidersHorizontal,
  FolderPlus,
  RefreshCw,
  Barcode,
} from 'lucide-react';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState('ALL');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Modal States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Product Form State
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    barcode: '',
    categoryId: '',
    costPrice: '',
    sellingPrice: '',
    taxRate: 8.0,
    stockQuantity: 10,
    minStockThreshold: 5,
    unit: 'pcs',
    imageUrl: '',
  });

  // Stock Adjustment Form State
  const [stockForm, setStockForm] = useState({
    productId: '',
    quantityChange: 1,
    type: 'ADD',
    reason: 'RESTOCK',
    notes: '',
  });

  // Category Form State
  const [newCatName, setNewCatName] = useState('');

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/products?isActive=all'),
        api.get('/products/categories'),
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (e) {
      console.error('Failed to fetch inventory:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateProduct = () => {
    setEditingProduct(null);
    const randBarcode = '8901' + Math.floor(1000 + Math.random() * 9000);
    const randSKU = 'ECO-' + Math.floor(100 + Math.random() * 900);
    setProductForm({
      name: '',
      sku: randSKU,
      barcode: randBarcode,
      categoryId: categories[0]?.id || '',
      costPrice: '',
      sellingPrice: '',
      taxRate: 8.0,
      stockQuantity: 10,
      minStockThreshold: 5,
      unit: 'pcs',
      imageUrl: '',
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      sku: prod.sku,
      barcode: prod.barcode,
      categoryId: prod.categoryId,
      costPrice: prod.costPrice,
      sellingPrice: prod.sellingPrice,
      taxRate: prod.taxRate,
      stockQuantity: prod.stockQuantity,
      minStockThreshold: prod.minStockThreshold,
      unit: prod.unit,
      imageUrl: prod.imageUrl || '',
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, productForm);
      } else {
        await api.post('/products', productForm);
      }
      setIsProductModalOpen(false);
      fetchInventoryData();
    } catch (error) {
      alert('Error saving product: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Are you sure you want to delete/deactivate this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      fetchInventoryData();
    } catch (e) {
      alert('Failed to delete product');
    }
  };

  const handleOpenStockAdjust = (prod) => {
    setStockForm({
      productId: prod.id,
      productName: prod.name,
      quantityChange: 5,
      type: 'ADD',
      reason: 'RESTOCK',
      notes: '',
    });
    setIsStockModalOpen(true);
  };

  const handleSaveStockAdjust = async (e) => {
    e.preventDefault();
    try {
      await api.post('/products/adjust-stock', stockForm);
      setIsStockModalOpen(false);
      fetchInventoryData();
    } catch (error) {
      alert('Failed to adjust stock: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName) return;
    try {
      await api.post('/products/categories', { name: newCatName });
      setNewCatName('');
      setIsCategoryModalOpen(false);
      fetchInventoryData();
    } catch (error) {
      alert('Failed to create category');
    }
  };

  const handleExportCSV = async () => {
    window.open('/api/products/export/csv', '_blank');
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCatFilter === 'ALL' || p.categoryId === selectedCatFilter;
    const matchesLowStock = !lowStockOnly || p.stockQuantity <= p.minStockThreshold;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.barcode.includes(q);

    return matchesCategory && matchesLowStock && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-8">
      {/* Header & Main Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Product & Inventory Catalog</h2>
          <p className="text-xs text-slate-400">Manage stock quantities, barcodes, prices & categories</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 rounded-xl flex items-center space-x-1.5 transition"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 rounded-xl flex items-center space-x-1.5 transition"
          >
            <FolderPlus className="w-4 h-4 text-emerald-400" />
            <span>Categories</span>
          </button>

          <button
            onClick={handleOpenCreateProduct}
            className="px-3 py-2 bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-lg shadow-brand-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by SKU, barcode, product name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {/* Category Dropdown */}
          <select
            value={selectedCatFilter}
            onChange={(e) => setSelectedCatFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-300 px-3 py-2 rounded-xl focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Low Stock Toggle */}
          <button
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition ${
              lowStockOnly
                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Low Stock Only</span>
          </button>
        </div>
      </div>

      {/* Product Table */}
      <div className="glass-panel border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="p-3.5">Product</th>
                <th className="p-3.5">Barcode / SKU</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5 text-right">Cost Price</th>
                <th className="p-3.5 text-right">Selling Price</th>
                <th className="p-3.5 text-center">Stock Qty</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-500">
                    No products matching search criteria
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.stockQuantity <= p.minStockThreshold;
                  return (
                    <tr key={p.id} className="hover:bg-slate-900/40 transition">
                      <td className="p-3.5">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-emerald-400 border border-slate-700">
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-100">{p.name}</p>
                            <p className="text-[10px] text-slate-500">Unit: {p.unit}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 font-mono text-slate-400">
                        <p className="text-slate-200">{p.barcode}</p>
                        <p className="text-[10px] text-slate-500">{p.sku}</p>
                      </td>

                      <td className="p-3.5">
                        <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-slate-300">
                          {p.category?.name || 'Uncategorized'}
                        </span>
                      </td>

                      <td className="p-3.5 text-right font-medium text-slate-400">
                        {formatCurrency(p.costPrice)}
                      </td>

                      <td className="p-3.5 text-right font-bold text-emerald-400">
                        {formatCurrency(p.sellingPrice)}
                      </td>

                      <td className="p-3.5 text-center">
                        <span
                          className={`font-bold px-2.5 py-1 rounded-lg text-xs ${
                            isLow
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {p.stockQuantity} {p.unit}
                        </span>
                      </td>

                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            p.isActive ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 bg-slate-800'
                          }`}
                        >
                          {p.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td className="p-3.5 text-right space-x-1">
                        <button
                          onClick={() => handleOpenStockAdjust(p)}
                          className="p-1.5 text-amber-400 hover:bg-slate-800 rounded-lg transition"
                          title="Adjust Stock"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditProduct(p)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                          title="Edit Product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={editingProduct ? 'Edit Product' : 'Add New Eco Product'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Product Name</label>
              <input
                type="text"
                required
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Category</label>
              <select
                value={productForm.categoryId}
                onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">SKU</label>
              <input
                type="text"
                required
                value={productForm.sku}
                onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Barcode</label>
              <input
                type="text"
                required
                value={productForm.barcode}
                onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Cost Price (LKR)</label>
              <input
                type="number"
                step="any"
                required
                value={productForm.costPrice}
                onChange={(e) => setProductForm({ ...productForm, costPrice: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Selling Price (LKR)</label>
              <input
                type="number"
                step="any"
                required
                value={productForm.sellingPrice}
                onChange={(e) => setProductForm({ ...productForm, sellingPrice: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold text-emerald-400"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Tax Rate (VAT %)</label>
              <input
                type="number"
                value={productForm.taxRate}
                onChange={(e) => setProductForm({ ...productForm, taxRate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Stock Quantity</label>
              <input
                type="number"
                required
                value={productForm.stockQuantity}
                onChange={(e) => setProductForm({ ...productForm, stockQuantity: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Min Threshold</label>
              <input
                type="number"
                value={productForm.minStockThreshold}
                onChange={(e) => setProductForm({ ...productForm, minStockThreshold: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Unit</label>
              <select
                value={productForm.unit}
                onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              >
                <option value="pcs">pcs</option>
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="pack">pack</option>
                <option value="box">box</option>
                <option value="set">set</option>
                <option value="bottle">bottle</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold rounded-xl text-sm transition"
            >
              {editingProduct ? 'Update Product Details' : 'Save & Add to Catalog'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        title={`Adjust Stock Level: ${stockForm.productName}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveStockAdjust} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Action Type</label>
              <select
                value={stockForm.type}
                onChange={(e) => setStockForm({ ...stockForm, type: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              >
                <option value="ADD">ADD (+ Increase)</option>
                <option value="REMOVE">REMOVE (- Deduct)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Quantity Change</label>
              <input
                type="number"
                min="1"
                required
                value={stockForm.quantityChange}
                onChange={(e) => setStockForm({ ...stockForm, quantityChange: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Reason</label>
            <select
              value={stockForm.reason}
              onChange={(e) => setStockForm({ ...stockForm, reason: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
            >
              <option value="RESTOCK">Restock (Received Supply)</option>
              <option value="DAMAGE">Damaged / Broken Goods</option>
              <option value="RETURN">Customer Return</option>
              <option value="EXPIRED">Expired / Spoiled</option>
              <option value="CORRECTION">Manual Inventory Correction</option>
            </select>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Notes (Optional)</label>
            <input
              type="text"
              placeholder="Reason details..."
              value={stockForm.notes}
              onChange={(e) => setStockForm({ ...stockForm, notes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition"
          >
            Confirm Stock Adjustment
          </button>
        </form>
      </Modal>

      {/* Category Creation Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Add New Category"
        maxWidth="max-w-sm"
      >
        <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Category Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Organic Teas"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-brand-500 text-slate-950 font-bold rounded-xl text-sm"
          >
            Create Category
          </button>
        </form>
      </Modal>
    </div>
  );
}
