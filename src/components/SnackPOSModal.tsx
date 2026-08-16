import React, { useState } from 'react';
import {
  X,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Coffee,
  DollarSign,
  Package,
  Layers,
  Search,
} from 'lucide-react';
import { Product, Station, PaymentMethod } from '../types';
import { useCafe } from '../context/CafeContext';
import { formatCurrency } from '../utils/formatters';

interface SnackPOSModalProps {
  initialStationTarget?: Station | null;
  onClose: () => void;
}

export const SnackPOSModal: React.FC<SnackPOSModalProps> = ({
  initialStationTarget,
  onClose,
}) => {
  const {
    products,
    stations,
    settings,
    addOrderToSession,
    directConcessionCheckout,
    addProduct,
  } = useCafe();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [targetStationId, setTargetStationId] = useState<string>(
    initialStationTarget?.id || 'direct_sale'
  );
  const [walkInCustomerName, setWalkInCustomerName] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [customMethodName, setCustomMethodName] = useState<string>('Card / POS');
  const [trxId, setTrxId] = useState<string>('');
  const [senderNumber, setSenderNumber] = useState<string>('');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // New product form
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<Product['category']>('snack');
  const [newProdStock, setNewProdStock] = useState('20');
  const [newProdEmoji, setNewProdEmoji] = useState('🍿');

  const activeStations = stations.filter((s) => s.currentSession);

  // Cart operations
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.product.id === product.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + 1 };
        return updated;
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as { product: Product; quantity: number }[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  // Submit order
  const handleProcessOrder = () => {
    if (cart.length === 0) return;

    if (targetStationId === 'direct_sale') {
      // Direct POS Sale
      directConcessionCheckout(
        cart,
        paymentMethod,
        walkInCustomerName || 'Walk-in Customer',
        paymentMethod === 'cash' ? cartTotal : undefined,
        {
          customPaymentName: paymentMethod === 'custom' ? customMethodName.trim() || 'Custom' : undefined,
          trxId: trxId.trim() || undefined,
          senderNumber: senderNumber.trim() || undefined,
        }
      );
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1200);
    } else {
      // Add each item to chosen station tab
      cart.forEach((item) => {
        addOrderToSession(targetStationId, item.product, item.quantity);
      });
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1200);
    }
  };

  // Add custom product
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(newProdPrice);
    if (!newProdName || isNaN(priceNum)) return;

    addProduct({
      name: newProdName,
      price: priceNum,
      category: newProdCategory,
      stock: parseInt(newProdStock, 10) || 10,
      imageEmoji: newProdEmoji || '🍿',
    });

    setNewProdName('');
    setNewProdPrice('');
    setShowAddProduct(false);
  };

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl shadow-black/80 my-4 sm:my-8 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/95 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_10px_rgba(251,191,36,0.15)]">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Concessions, Drinks & Extras POS
              </h2>
              <p className="text-xs text-zinc-400">
                Order beverages, food, or accessories to an active station tab or direct walk-in cash sale
              </p>
            </div>
          </div>
          <button
            id="close-pos-btn"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Left Products Grid + Right Cart Panel */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left: Product Catalog */}
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto border-b md:border-b-0 md:border-r border-zinc-800/80 flex flex-col">
            
            {/* Search & Categories */}
            <div className="space-y-3 mb-4 shrink-0">
              <div className="flex items-center justify-between gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search snacks, energy drinks, noodles..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
                  />
                </div>
                <button
                  onClick={() => setShowAddProduct(!showAddProduct)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-zinc-700 whitespace-nowrap transition-colors shadow-xs"
                >
                  {showAddProduct ? 'Cancel' : '+ New Item'}
                </button>
              </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'All Items' },
                { id: 'drink', label: '⚡ Energy & Drinks' },
                { id: 'food', label: '🍜 Food & Noodles' },
                { id: 'snack', label: '🥔 Snacks & Chips' },
                { id: 'accessory', label: '🎮 Accessories' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === c.id
                      ? 'bg-amber-500 text-zinc-950 font-bold shadow-[0_0_10px_rgba(251,191,36,0.25)]'
                      : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Add Product Form if open */}
          {showAddProduct && (
            <form
              onSubmit={handleCreateProduct}
              className="p-3 mb-4 rounded-xl bg-zinc-950 border border-amber-500/30 space-y-2 shrink-0 shadow-inner"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300">Add New Inventory Item</span>
                <span className="text-[10px] text-zinc-400">Instant catalog update</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="Product Name"
                  className="col-span-2 px-2.5 py-1 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-amber-500"
                />
                <input
                  type="number"
                  step="0.25"
                  required
                  value={newProdPrice}
                  onChange={(e) => setNewProdPrice(e.target.value)}
                  placeholder={`Price (${settings.currencySymbol})`}
                  className="px-2.5 py-1 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-white font-mono focus:outline-none focus:border-amber-500"
                />
                <select
                  value={newProdCategory}
                  onChange={(e) => setNewProdCategory(e.target.value as Product['category'])}
                  className="px-2.5 py-1 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="drink">Drink</option>
                  <option value="snack">Snack</option>
                  <option value="food">Food</option>
                  <option value="accessory">Accessory</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="submit"
                  className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-500 text-zinc-950 shadow-xs"
                >
                  Save Product
                </button>
              </div>
            </form>
          )}

          {/* Products Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 overflow-y-auto pr-1">
            {filteredProducts.map((prod) => (
              <button
                key={prod.id}
                onClick={() => addToCart(prod)}
                className="p-3 rounded-xl bg-zinc-950/90 border border-zinc-800/80 hover:border-amber-500/50 hover:bg-zinc-900 text-left transition-all group flex flex-col justify-between active:scale-[0.98] shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xl">{prod.imageEmoji}</span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      Stock: {prod.stock}
                    </span>
                  </div>
                  <h4 className="font-semibold text-xs text-white group-hover:text-amber-300 transition-colors line-clamp-2">
                    {prod.name}
                  </h4>
                </div>
                <div className="mt-2 flex items-center justify-between pt-1 border-t border-zinc-900">
                  <span className="font-bold text-xs text-emerald-400 font-mono">
                    {formatCurrency(prod.price, settings.currencySymbol)}
                  </span>
                  <span className="p-1 rounded-lg bg-zinc-800 group-hover:bg-amber-500 group-hover:text-zinc-950 text-zinc-300 text-xs transition-colors">
                    <Plus className="w-3 h-3" />
                  </span>
                </div>
              </button>
            ))}
          </div>

        </div>

        {/* Right: Cart & Destination Panel */}
        <div className="w-full md:w-80 p-4 sm:p-5 bg-zinc-950/80 flex flex-col justify-between overflow-y-auto">
          
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                Order Cart ({cart.reduce((s, i) => s + i.quantity, 0)})
              </span>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-[11px] text-zinc-500 hover:text-red-400 transition-colors font-mono"
                >
                  Clear Cart
                </button>
              )}
            </div>

            {/* Destination Selector */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-zinc-300">
                Deliver / Charge To:
              </label>
              <select
                id="pos-target-destination"
                value={targetStationId}
                onChange={(e) => setTargetStationId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-white font-medium focus:outline-none focus:border-amber-500"
              >
                <option value="direct_sale">⚡ Direct Cash/Card Sale (Walk-in)</option>
                {activeStations.length > 0 && (
                  <optgroup label="Active Station Tabs">
                    {activeStations.map((st) => (
                      <option key={st.id} value={st.id}>
                        🎮 {st.name} ({st.currentSession?.customerName})
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            {/* Direct Sale options */}
            {targetStationId === 'direct_sale' && (
              <div className="space-y-2.5 p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1">
                    Customer Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={walkInCustomerName}
                    onChange={(e) => setWalkInCustomerName(e.target.value)}
                    placeholder="Walk-in Guest"
                    className="w-full px-2.5 py-1 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1">Payment Method</label>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { id: 'cash', label: 'Cash', activeClass: 'bg-emerald-500 text-zinc-950 font-bold' },
                      { id: 'bkash', label: 'bKash', activeClass: 'bg-[#E2136E] text-white font-bold' },
                      { id: 'nagad', label: 'Nagad', activeClass: 'bg-[#F7941D] text-zinc-950 font-bold' },
                      { id: 'custom', label: 'Custom', activeClass: 'bg-cyan-500 text-zinc-950 font-bold' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                        className={`py-1 px-1 text-[10px] rounded-lg transition-all text-center ${
                          paymentMethod === m.id
                            ? m.activeClass
                            : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional TrxID / Ref for non-cash */}
                {paymentMethod === 'bkash' && (
                  <div>
                    <input
                      type="text"
                      value={trxId}
                      onChange={(e) => setTrxId(e.target.value)}
                      placeholder="bKash TrxID (Optional)"
                      className="w-full px-2.5 py-1 text-[11px] rounded-lg bg-zinc-950 border border-pink-500/30 text-white uppercase font-mono focus:outline-none focus:border-pink-400"
                    />
                  </div>
                )}
                {paymentMethod === 'nagad' && (
                  <div>
                    <input
                      type="text"
                      value={trxId}
                      onChange={(e) => setTrxId(e.target.value)}
                      placeholder="Nagad TrxID (Optional)"
                      className="w-full px-2.5 py-1 text-[11px] rounded-lg bg-zinc-950 border border-orange-500/30 text-white uppercase font-mono focus:outline-none focus:border-orange-400"
                    />
                  </div>
                )}
                {paymentMethod === 'custom' && (
                  <div>
                    <input
                      type="text"
                      value={customMethodName}
                      onChange={(e) => setCustomMethodName(e.target.value)}
                      placeholder="Custom Method (e.g. Card, Bank, Voucher)"
                      className="w-full px-2.5 py-1 text-[11px] rounded-lg bg-zinc-950 border border-cyan-500/30 text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Cart Items List */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-500">
                  Cart is empty. Tap items on the left to add snacks or drinks.
                </div>
              ) : (
                cart.map(({ product, quantity }) => (
                  <div
                    key={product.id}
                    className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 flex-1 mr-2">
                      <span className="font-semibold text-white truncate block">
                        {product.name}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {formatCurrency(product.price, settings.currencySymbol)} each
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateCartQuantity(product.id, -1)}
                        className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center font-mono font-bold text-white">
                        {quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(product.id, 1)}
                        className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(product.id)}
                        className="p-1 text-zinc-500 hover:text-red-400 ml-1 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bottom Checkout Action */}
          <div className="pt-4 border-t border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-medium">Cart Total</span>
              <span className="text-xl font-bold font-mono text-emerald-400">
                {formatCurrency(cartTotal, settings.currencySymbol)}
              </span>
            </div>

            {isSuccess ? (
              <div className="w-full py-3 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 animate-bounce shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Order Processed Successfully!</span>
              </div>
            ) : (
              <button
                id="submit-pos-order-btn"
                disabled={cart.length === 0}
                onClick={handleProcessOrder}
                className={`w-full py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                  cart.length === 0
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-400 via-emerald-400 to-teal-400 hover:from-amber-300 hover:to-emerald-300 text-zinc-950 shadow-[0_0_20px_rgba(251,191,36,0.3)]'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {targetStationId === 'direct_sale'
                    ? `Charge ${formatCurrency(cartTotal, settings.currencySymbol)} & Print`
                    : `Add to Station Tab (+${formatCurrency(cartTotal, settings.currencySymbol)})`}
                </span>
              </button>
            )}
          </div>

        </div>

      </div>

    </div>
  </div>
  );
};
