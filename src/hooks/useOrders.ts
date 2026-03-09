import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import type { Order, OrderItem, OrderStatus, OrderSummary, PaymentStatus } from '@/lib/supabase';

// Global cache
let ordersCache: Order[] | null = null;
let summariesCache: OrderSummary[] | null = null;
let lastOrdersFetch = 0;
const CACHE_DURATION = 5000; // 5 detik

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>(ordersCache || []);
  const [orderSummaries, setOrderSummaries] = useState<OrderSummary[]>(summariesCache || []);
  const [loading, setLoading] = useState(!ordersCache);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<any>(null);
  const isInitialMount = useRef(true);
  const isFetching = useRef(false);

  const fetchOrders = useCallback(async (force = false) => {
    console.log('[useOrders] fetchOrders called, force:', force, 'isFetching:', isFetching.current);
    
    // Prevent concurrent fetches
    if (isFetching.current) {
      console.log('[useOrders] Already fetching, skipping...');
      return;
    }
    
    const now = Date.now();
    if (!force && ordersCache && summariesCache && (now - lastOrdersFetch) < CACHE_DURATION) {
      console.log('[useOrders] Using cache, last fetch:', (now - lastOrdersFetch), 'ms ago');
      setOrders([...ordersCache]);
      setOrderSummaries([...summariesCache]);
      setLoading(false);
      return;
    }
    
    console.log('[useOrders] Fetching from Supabase...');

    isFetching.current = true;

    try {
      if (!ordersCache) setLoading(true);
      setError(null);

      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

      const { data: summaryData, error: summaryError } = await supabase
        .from('orders')
        .select(`
          id, 
          order_number, 
          queue_number, 
          customer_name, 
          status, 
          payment_status, 
          payment_method, 
          subtotal, 
          tax_amount, 
          total_amount, 
          created_at,
          order_items(count)
        `)
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${tomorrow}T00:00:00`)
        .order('created_at', { ascending: true });

      if (summaryError) throw summaryError;

      const summaries = (summaryData || []).map((order: any) => {
        const count = Array.isArray(order.order_items) 
          ? order.order_items[0]?.count 
          : order.order_items?.count;
        return { ...order, item_count: count || 0 };
      });
      
      // Selalu update state dengan reference baru untuk trigger re-render
      summariesCache = [...summaries];
      setOrderSummaries([...summaries]);

      if (summaries.length > 0) {
        const orderIds = summaries.map(o => o.id);
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .in('id', orderIds);

        if (ordersError) throw ordersError;
        
        ordersCache = [...(ordersData || [])];
        setOrders([...(ordersData || [])]);
      } else {
        ordersCache = [];
        setOrders([]);
      }

      lastOrdersFetch = Date.now();
      console.log('[useOrders] Fetch completed, summaries:', summaries.length);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, []); // No dependencies - use global cache only

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      fetchOrders();
    }

    let debounceTimer: any;
    
    // Hapus channel lama jika ada
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }
    
    subscriptionRef.current = supabase
      .channel('orders_changes_live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('[useOrders] Real-time update:', payload.eventType, payload.new);
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            console.log('[useOrders] Fetching updated orders...');
            fetchOrders(true);
          }, 300);
        }
      )
      .subscribe((status) => {
        console.log('[useOrders] Subscription status:', status);
      });

    return () => {
      clearTimeout(debounceTimer);
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [fetchOrders]);

  const getOrderItems = useCallback(async (orderId: number): Promise<OrderItem[]> => {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching order items:', err);
      return [];
    }
  }, []);

  const createOrder = useCallback(async (
    customerName: string, 
    tableNumber: string | undefined,
    items: { menu_item_id: number; name: string; quantity: number; unit_price: number; notes?: string; subtotal: number }[]
  ) => {
    try {
      const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
      const taxAmount = Math.round(subtotal * 0.1);
      const totalAmount = subtotal + taxAmount;

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          customer_name: customerName,
          table_number: tableNumber || null,
          status: 'BARU' as OrderStatus,
          payment_status: 'BELUM_BAYAR' as PaymentStatus,
          subtotal,
          tax_amount: taxAmount,
          total_amount: totalAmount
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map(item => ({
        order_id: orderData.id,
        menu_item_id: item.menu_item_id,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        notes: item.notes || null,
        subtotal: item.subtotal
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      fetchOrders(true);

      return { success: true, data: orderData };
    } catch (err: any) {
      console.error('Error creating order:', err);
      return { success: false, error: err.message };
    }
  }, [fetchOrders]);

  const updateOrderStatus = useCallback(async (orderId: number, status: OrderStatus) => {
    try {
      setOrderSummaries(prev => {
        const updated = prev.map(summary => 
          summary.id === orderId ? { ...summary, status } : summary
        );
        summariesCache = updated;
        return updated;
      });

      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;
      
      return { success: true };
    } catch (err: any) {
      console.error('Error updating order status:', err);
      fetchOrders(true);
      return { success: false, error: err.message };
    }
  }, [fetchOrders]);

  const updatePaymentStatus = useCallback(async (orderId: number, paymentStatus: PaymentStatus) => {
    try {
      setOrderSummaries(prev => {
        const updated = prev.map(summary => 
          summary.id === orderId ? { ...summary, payment_status: paymentStatus } : summary
        );
        summariesCache = updated;
        return updated;
      });

      const { error } = await supabase
        .from('orders')
        .update({ payment_status: paymentStatus })
        .eq('id', orderId);

      if (error) throw error;
      
      await fetchOrders(true);
      return { success: true };
    } catch (err: any) {
      console.error('Error updating payment status:', err);
      fetchOrders(true);
      return { success: false, error: err.message };
    }
  }, [fetchOrders]);

  const activeOrders = useMemo(() => 
    orderSummaries.filter(o => ['BARU', 'DIPROSES', 'SIAP'].includes(o.status)),
    [orderSummaries]
  );

  const todayOrders = useMemo(() => orderSummaries, [orderSummaries]);

  return {
    orders,
    orderSummaries,
    activeOrders,
    todayOrders,
    loading,
    error,
    refetch: () => fetchOrders(true),
    getOrderItems,
    createOrder,
    updateOrderStatus,
    updatePaymentStatus
  };
}
