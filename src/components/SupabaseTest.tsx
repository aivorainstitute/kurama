import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, CheckCircle, XCircle, Database, AlertTriangle, Wifi, WifiOff } from 'lucide-react';

export default function SupabaseTest() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [message, setMessage] = useState('Memeriksa koneksi...');
  const [tables, setTables] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<any>({});
  const [networkStatus, setNetworkStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    checkConnection();
  }, []);

  async function checkNetwork() {
    try {
      // Check if we're online
      if (!navigator.onLine) {
        setNetworkStatus('offline');
        return false;
      }
      
      // Try to fetch a simple request to test network
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      
      try {
        await fetch('https://www.google.com/favicon.ico', { 
          mode: 'no-cors',
          signal: controller.signal 
        });
        clearTimeout(timeout);
        setNetworkStatus('online');
        return true;
      } catch (e) {
        clearTimeout(timeout);
        setNetworkStatus('offline');
        return false;
      }
    } catch (e) {
      setNetworkStatus('offline');
      return false;
    }
  }

  async function checkConnection() {
    try {
      setStatus('checking');
      setMessage('Checking network...');
      setError(null);

      // Step 1: Check network
      const isOnline = await checkNetwork();
      if (!isOnline) {
        setStatus('error');
        setError('Tidak ada koneksi internet');
        setMessage('Periksa koneksi internet Anda');
        return;
      }

      // Step 2: Check env vars
      setMessage('Checking Supabase credentials...');
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const debugInfo: any = {
        network: 'online',
        url: url || 'NOT SET',
        key: key ? `${key.slice(0, 20)}... (${key.length} chars)` : 'NOT SET',
        browserOnline: navigator.onLine,
        userAgent: navigator.userAgent.slice(0, 50) + '...'
      };

      if (!url || !key) {
        setStatus('error');
        setError('Environment variables not set');
        setMessage('VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY tidak ditemukan');
        setDebug(debugInfo);
        return;
      }

      // Step 3: Test direct fetch to Supabase REST endpoint
      setMessage('Testing direct connection to Supabase...');
      try {
        const testUrl = `${url}/rest/v1/menu_items?select=count&limit=1`;
        debugInfo.testUrl = testUrl;
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(testUrl, {
          method: 'GET',
          headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`
          },
          signal: controller.signal
        });
        
        clearTimeout(timeout);
        
        debugInfo.responseStatus = response.status;
        debugInfo.responseStatusText = response.statusText;
        debugInfo.responseHeaders = Object.fromEntries(response.headers.entries());
        
        if (!response.ok) {
          const errorText = await response.text();
          debugInfo.errorResponse = errorText;
          
          if (response.status === 404) {
            setError('Tabel menu_items tidak ditemukan (404)');
          } else if (response.status === 401) {
            setError('Unauthorized - API Key salah atau RLS aktif (401)');
          } else if (response.status === 0) {
            setError('CORS Error - Request diblokir browser');
          } else {
            setError(`HTTP Error ${response.status}: ${response.statusText}`);
          }
          
          setStatus('error');
          setMessage('Gagal terhubung ke Supabase REST API');
          setDebug(debugInfo);
          return;
        }
        
        const data = await response.json();
        debugInfo.responseData = data;
        
      } catch (fetchError: any) {
        debugInfo.fetchError = fetchError.toString();
        debugInfo.fetchErrorName = fetchError.name;
        debugInfo.fetchErrorMessage = fetchError.message;
        
        if (fetchError.name === 'AbortError') {
          setError('Request timeout - Supabase tidak merespons dalam 10 detik');
        } else if (fetchError.message?.includes('Failed to fetch')) {
          setError('Network Error - CORS, firewall, atau URL salah. Coba pakai browser lain atau disable CORS extension.');
        } else {
          setError(`Fetch Error: ${fetchError.message}`);
        }
        
        setStatus('error');
        setMessage('Gagal fetch ke Supabase');
        setDebug(debugInfo);
        return;
      }

      // Step 4: Test with Supabase client
      setMessage('Testing with Supabase client...');
      try {
        const { data: menuData, error: menuError } = await supabase
          .from('menu_items')
          .select('*')
          .limit(3);

        if (menuError) {
          debugInfo.supabaseError = menuError;
          setStatus('error');
          setError(menuError.message);
          setMessage('Supabase client error');
          setDebug(debugInfo);
          return;
        }

        // Step 5: Check orders table
        const { error: orderError } = await supabase
          .from('orders')
          .select('count', { count: 'exact', head: true });

        const availableTables = ['✅ menu_items'];
        if (!orderError) availableTables.push('✅ orders');
        else debugInfo.ordersError = orderError.message;

        setTables(availableTables);
        setStatus('connected');
        setMessage(`Berhasil! ${menuData?.length || 0} item di menu_items`);
        debugInfo.menuDataCount = menuData?.length;
        
      } catch (supabaseError: any) {
        debugInfo.supabaseCatchError = supabaseError.toString();
        setStatus('error');
        setError(supabaseError.message);
        setMessage('Error saat menggunakan Supabase client');
      }

      setDebug(debugInfo);

    } catch (err: any) {
      console.error('Unexpected error:', err);
      setStatus('error');
      setError(err.message || 'Unknown error');
      setMessage('Terjadi kesalahan tak terduga');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-6 max-w-lg w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-[#0D7377]/10 rounded-xl flex items-center justify-center">
            <Database className="w-6 h-6 text-[#0D7377]" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-800">Supabase Test</h1>
            <p className="text-sm text-gray-500">Diagnostic koneksi database</p>
          </div>
          <div className={`p-2 rounded-full ${
            networkStatus === 'online' ? 'bg-green-100' : 
            networkStatus === 'offline' ? 'bg-red-100' : 'bg-gray-100'
          }`}>
            {networkStatus === 'online' ? <Wifi className="w-5 h-5 text-green-600" /> :
             networkStatus === 'offline' ? <WifiOff className="w-5 h-5 text-red-600" /> :
             <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />}
          </div>
        </div>

        {/* Status Card */}
        <div className={`rounded-xl p-4 mb-6 ${
          status === 'checking' ? 'bg-blue-50 border border-blue-100' :
          status === 'connected' ? 'bg-green-50 border border-green-100' :
          'bg-red-50 border border-red-100'
        }`}>
          <div className="flex items-center gap-3">
            {status === 'checking' && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
            {status === 'connected' && <CheckCircle className="w-5 h-5 text-green-500" />}
            {status === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
            
            <div>
              <p className={`font-medium ${
                status === 'checking' ? 'text-blue-700' :
                status === 'connected' ? 'text-green-700' :
                'text-red-700'
              }`}>
                {status === 'checking' ? 'Memeriksa...' :
                 status === 'connected' ? 'Terhubung!' :
                 'Gagal Terhubung'}
              </p>
              <p className="text-sm opacity-80">{message}</p>
            </div>
          </div>
        </div>

        {/* Tables List */}
        {tables.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Tabel Tersedia:</h3>
            <div className="space-y-1">
              {tables.map((table, idx) => (
                <p key={idx} className="text-sm text-gray-600">{table}</p>
              ))}
            </div>
          </div>
        )}

        {/* Error Details */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Debug Info - Collapsible */}
        <details className="mb-6">
          <summary className="text-sm font-medium text-gray-600 cursor-pointer">
            Debug Info (klik untuk expand)
          </summary>
          <pre className="mt-2 text-xs text-gray-600 bg-gray-100 p-3 rounded-lg overflow-auto max-h-60">
            {JSON.stringify(debug, null, 2)}
          </pre>
        </details>

        {/* Retry Button */}
        <button
          onClick={checkConnection}
          disabled={status === 'checking'}
          className="w-full py-3 bg-[#0D7377] text-white rounded-xl font-medium hover:bg-[#095C5F] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {status === 'checking' ? 'Memeriksa...' : 'Coba Lagi'}
        </button>

        {/* Troubleshooting Guide */}
        {status === 'error' && (
          <div className="mt-4 space-y-3">
            <div className="p-3 bg-amber-50 rounded-lg">
              <p className="font-medium text-amber-700 text-sm mb-2">🔧 Solusi Umum:</p>
              <ol className="text-xs text-amber-700 space-y-2 list-decimal pl-4">
                <li>
                  <b>CORS Issue (Paling Umum):</b>
                  <ul className="list-disc pl-4 mt-1">
                    <li>Pakai browser tanpa CORS blocker (Chrome biasanya aman)</li>
                    <li>Disable extension ad-blocker sementara</li>
                    <li>Jalankan dengan: <code>npm run dev -- --host</code></li>
                  </ul>
                </li>
                <li>
                  <b>Check Supabase Project:</b>
                  <ul className="list-disc pl-4 mt-1">
                    <li>Buka Supabase Dashboard → Project Settings</li>
                    <li>Pastikan project <b>tidak paused</b></li>
                    <li>Copy ulang URL dan Anon Key</li>
                  </ul>
                </li>
                <li>
                  <b>Restart Vite:</b> Tutup terminal, jalankan ulang <code>npm run dev</code>
                </li>
              </ol>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="font-medium text-blue-700 text-sm mb-2">🔗 Cek URL Supabase:</p>
              <p className="text-xs text-blue-600">
                URL Anda: <code>https://uidfzbsrbrridgkskokx.supabase.co</code>
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Pastikan formatnya: <code>https://[project-ref].supabase.co</code>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
