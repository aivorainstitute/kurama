import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { MenuItem } from '@/lib/supabase';

// Cache global untuk menyimpan data
let globalCache: MenuItem[] | null = null;
let lastFetch = 0;
const CACHE_DURATION = 60000; // 1 menit cache

export function useMenuItems() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(globalCache || []);
  const [loading, setLoading] = useState(!globalCache);
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _subscriptionRef = useRef<any>(null);
  const isInitialMount = useRef(true);
  const timeoutRef = useRef<any>(null);

  const fetchMenuItems = useCallback(async (force = false) => {
    // Clear timeout sebelumnya jika ada
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Gunakan cache jika masih valid
    const now = Date.now();
    if (!force && globalCache && (now - lastFetch) < CACHE_DURATION) {
      console.log('Using cached menu items:', globalCache.length);
      setMenuItems(globalCache);
      setLoading(false);
      return;
    }

    // Set timeout 5 detik untuk force stop loading
    timeoutRef.current = setTimeout(() => {
      console.log('Fetch timeout - forcing stop loading');
      setLoading(false);
      if (!globalCache) {
        setMenuItems([]);
        setError('Timeout - tidak dapat memuat menu');
      }
    }, 5000);

    try {
      if (!globalCache) setLoading(true);
      setError(null);
      
      console.log('Fetching menu items from Supabase...');
      
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('id');

      // Clear timeout karena request selesai
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      console.log('Menu items response:', { dataLength: data?.length, error });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      // Category_name sudah ada di tabel menu_items
      const items = (data || []).map((item: any) => ({
        ...item,
        category_name: item.category_name || 'Lainnya'
      }));
      
      globalCache = items;
      lastFetch = Date.now();
      setMenuItems(items);
      console.log('Menu items loaded successfully:', items.length);
    } catch (err: any) {
      console.error('Error fetching menu items:', err);
      setError(err.message || 'Gagal memuat menu');
      // Jangan biarkan loading terus - set ke false meskipun error
      setMenuItems(globalCache || []);
    } finally {
      setLoading(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    // Fetch initial data
    if (isInitialMount.current) {
      isInitialMount.current = false;
      console.log('Initial mount - fetching menu items');
      fetchMenuItems();
    }

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [fetchMenuItems]);

  const refetch = useCallback(() => {
    console.log('Manual refetch triggered');
    return fetchMenuItems(true);
  }, [fetchMenuItems]);

  // Fungsi untuk update stock
  const updateStock = useCallback(async (id: number, delta: number) => {
    try {
      // Get current stock
      const currentItem = menuItems.find(item => item.id === id);
      if (!currentItem) throw new Error('Item not found');
      
      const newStock = Math.max(0, currentItem.stock + delta);
      const isAvailable = newStock > 0;
      
      console.log('Updating stock:', { id, delta, newStock, isAvailable });
      
      // Optimistic update - update UI immediately
      const updatedItems = menuItems.map(item => 
        item.id === id 
          ? { ...item, stock: newStock, is_available: isAvailable }
          : item
      );
      globalCache = updatedItems;
      setMenuItems(updatedItems);
      
      const { error } = await supabase
        .from('menu_items')
        .update({ 
          stock: newStock,
          is_available: isAvailable
        })
        .eq('id', id);
      
      if (error) {
        console.error('Supabase update error:', error);
        // Revert on error
        setMenuItems(menuItems);
        globalCache = menuItems;
        throw error;
      }
      
      console.log('Stock updated successfully');
      return { success: true };
    } catch (err: any) {
      console.error('Error updating stock:', err);
      return { success: false, error: err.message };
    }
  }, [menuItems]);

  return {
    menuItems,
    loading,
    error,
    refetch,
    updateStock
  };
}

export function clearMenuCache() {
  console.log('Clearing menu cache');
  globalCache = null;
  lastFetch = 0;
}
