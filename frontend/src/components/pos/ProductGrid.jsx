import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/formatters';
import { Search, Barcode, Package, AlertTriangle } from 'lucide-react';

export default function ProductGrid({ barcodeScanQuery }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProductsAndCategories();
  }, []);

  // Handle USB barcode scanner input passed from parent
  useEffect(() => {
    if (barcodeScanQuery) {
      handleBarcodeLookup(barcodeScanQuery);
    }
  }, [barcodeScanQuery]);

  const fetchProductsAndCategories = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/products?isActive=true'),
        api.get('/products/categories'),
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeLookup = async (barcode) => {
    try {
      const res = await api.get(`/products/barcode/${barcode}`);
      if (res.data) {
        addToCart(res.data, 1);
      }
    } catch (e) {
      // Local fallback search in state
      const found = products.find(
        (p) => p.barcode === barcode || p.sku.toLowerCase() === barcode.toLowerCase()
      );
      if (found) {
        addToCart(found, 1);
      } else {
        alert(`No product found for barcode: ${barcode}`);
      }
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === 'ALL' || product.categoryId === selectedCategory;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      product.name.toLowerCase().includes(q) ||
      product.sku.toLowerCase().includes(q) ||
      product.barcode.includes(q);

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-900/40 rounded-2xl border border-slate-800 p-4">
      {/* Top Search & Filter Bar */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center space-x-3">
          {/* Fast Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search product by name, SKU, or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Barcode Scan Indicator */}
          <div className="flex items-center space-x-2 bg-emerald-950/50 border border-emerald-800/60 px-3 py-2 rounded-xl text-xs text-emerald-400 font-medium">
            <Barcode className="w-4 h-4 animate-pulse" />
            <span className="hidden sm:inline">USB Scanner Active</span>
          </div>
        </div>

        {/* Category Pills Slider */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === 'ALL'
                ? 'bg-brand-500 text-slate-950 shadow-md shadow-brand-500/20'
                : 'bg-slate-950/60 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            All Items ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? 'bg-brand-500 text-slate-950 shadow-md shadow-brand-500/20'
                  : 'bg-slate-950/60 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product Cards Grid */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-slate-400">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs">Loading Catalog...</p>
          </div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
          <Package className="w-12 h-12 text-slate-600 mb-2" />
          <p className="font-semibold text-slate-300">No products found</p>
          <p className="text-xs text-slate-500 mt-1">Try adjusting search term or category filter</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pr-1">
          {filteredProducts.map((product) => {
            const isLowStock = product.stockQuantity <= product.minStockThreshold;
            const isOutOfStock = product.stockQuantity <= 0;

            return (
              <button
                key={product.id}
                onClick={() => !isOutOfStock && addToCart(product, 1)}
                disabled={isOutOfStock}
                className={`group relative flex flex-col justify-between p-3.5 rounded-2xl text-left border transition-all duration-200 ${
                  isOutOfStock
                    ? 'bg-slate-950/40 border-slate-900 opacity-50 cursor-not-allowed'
                    : 'glass-card border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-800/60 active:scale-[0.98]'
                }`}
              >
                {/* Low Stock Badge */}
                {isLowStock && !isOutOfStock && (
                  <span className="absolute top-2 right-2 bg-amber-500/20 text-amber-400 border border-amber-500/40 px-1.5 py-0.5 rounded-md text-[10px] font-bold flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Low Stock ({product.stockQuantity})</span>
                  </span>
                )}

                {isOutOfStock && (
                  <span className="absolute top-2 right-2 bg-rose-500/20 text-rose-400 border border-rose-500/40 px-1.5 py-0.5 rounded-md text-[10px] font-bold">
                    Out of Stock
                  </span>
                )}

                <div>
                  {/* Category Pill */}
                  <span className="text-[10px] text-brand-400 font-semibold tracking-wide uppercase">
                    {product.category?.name || 'Item'}
                  </span>

                  {/* Product Title */}
                  <h4 className="font-semibold text-sm text-slate-100 group-hover:text-emerald-400 transition line-clamp-2 mt-1">
                    {product.name}
                  </h4>

                  <p className="text-[11px] text-slate-400 mt-1 font-mono">
                    SKU: {product.sku}
                  </p>
                </div>

                {/* Price & Unit Footer */}
                <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                  <span className="font-bold text-sm text-emerald-400">
                    {formatCurrency(product.sellingPrice)}
                  </span>
                  <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-400 border border-slate-800">
                    /{product.unit}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
