'use client';

import { useState, useRef, useEffect } from 'react';
import api from '@/lib/api';
import { useCartStore } from '@/store/cart';
import { usePosSettingsStore } from '@/store/pos-settings';
import { X, UserPlus, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Customer } from '@/lib/types';

interface Props {
  onSelected?: () => void;
  variant?: 'default' | 'topbar';
}

export default function CustomerSearch({ onSelected, variant = 'default' }: Props = {}) {
  const cart = useCartStore();
  const { phoneDigits } = usePosSettingsStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Customer[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [creating, setCreating] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const customer = cart.customer;

  // Auto-fetch customer when customerId is set but customer object is missing
  useEffect(() => {
    if (cart.customerId && !cart.customer) {
      api.get(`/customers/${cart.customerId}`)
        .then(res => cart.setCustomer(res.data.customer))
        .catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.customerId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setShowCreate(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchCustomers = (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await api.get(`/customers-search?q=${encodeURIComponent(q)}`);
        // Backend returns array directly
        setResults(Array.isArray(data) ? data : (data.customers || []));
      } catch { setResults([]); }
    }, 300);
  };

  const handleSelect = (c: Customer) => {
    cart.setCustomer(c);
    setShowDropdown(false);
    setQuery('');
    onSelected?.();
  };

  const handleClear = () => {
    cart.setCustomer(null);
  };

  const handleCreate = async () => {
    if (!newName.trim() || !newPhone.trim()) return;
    setCreating(true);
    try {
      const { data } = await api.post('/customers', {
        name: newName,
        phone: newPhone.replace(/\D/g, ''),
      });
      handleSelect(data.customer);
      setShowCreate(false);
      setNewName('');
      setNewPhone('');
      toast.success('Customer created');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to create customer');
    } finally {
      setCreating(false);
    }
  };

  if (customer) {
    if (variant === 'topbar') {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-light rounded-lg text-sm min-w-0 w-full">
          <div className="flex-1 min-w-0 flex items-center gap-x-2 gap-y-0 flex-wrap">
            <span className="font-semibold text-brand truncate">{customer.name}</span>
            <span className="text-brand/70 text-xs shrink-0">{customer.phone}</span>
          </div>
          <button onClick={handleClear} className="text-brand hover:text-brand-hover shrink-0 ml-auto">
            <X size={14} />
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between px-3 py-2 bg-brand-light rounded-lg text-sm">
        <div className="flex-1 min-w-0">
          <span className="font-medium text-brand truncate">{customer.name}</span>
          {customer.phone && (
            <span className="text-xs text-gray-500 ml-2">{customer.phone}</span>
          )}
        </div>
        <button onClick={handleClear} className="text-brand hover:text-brand-hover ml-2 shrink-0">
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); searchCustomers(e.target.value); setShowDropdown(true); }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Search by phone or name..."
          className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand outline-none"
        />
      </div>

      {showDropdown && query.length >= 2 && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {/* Search results */}
          {results.length > 0 && results.map((c) => (
            <button
              key={c.id || c.phone}
              onClick={() => handleSelect(c)}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm border-b border-gray-50 last:border-0"
            >
              <span className="font-medium">{c.name}</span>
              <span className="text-gray-400 ml-2">{c.phone}</span>
            </button>
          ))}

          {/* No results message */}
          {results.length === 0 && !showCreate && (
            <div className="px-3 py-2 text-sm text-gray-400">No customer found</div>
          )}

          {/* New Customer button - only show when no results found */}
          {!showCreate && results.length === 0 && (
            <button
              onClick={() => {
                setShowCreate(true);
                if (/^\d+$/.test(query.trim())) {
                  setNewPhone(query.trim());
                }
              }}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm text-brand font-medium flex items-center gap-1.5 border-t border-gray-100"
            >
              <UserPlus size={14} /> Add New Customer
            </button>
          )}

          {/* Create form */}
          {showCreate && (
            <div className="p-3 space-y-2">
              <input
                type="text"
                placeholder="Customer Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-brand"
                autoFocus
              />
              <input
                type="text"
                placeholder="Phone Number"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                maxLength={10}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-brand"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating || !newName.trim() || !newPhone.trim()}
                  className="flex-1 py-1.5 bg-brand text-white text-sm rounded-lg hover:bg-brand-hover disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
