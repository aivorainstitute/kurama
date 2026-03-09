import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Camera, 
  Plus, 
  Minus, 
  Trash2, 
  Save,
  Loader2,
  X,
  ImageIcon
} from 'lucide-react';
import { Navbar3D } from '@/components/Navbar3D';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { autoCompressImage } from '@/lib/imageCompression';
import { clearMenuCache } from '@/hooks/useMenuItems';
import type { MenuItem } from '@/lib/supabase';

const availableCategories = ['Signatures', 'Coffee', 'Minuman', 'Makanan', 'Camilan'];

export default function EditItem() {
  const navigate = useNavigate();
  const { itemId } = useParams<{ itemId: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [item, setItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<{ original: string; compressed: string } | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: 0,
    stock: 0,
    description: '',
    image_url: '',
  });

  // Fetch item data
  useEffect(() => {
    const fetchItem = async () => {
      if (!itemId) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('menu_items')
          .select('*')
          .eq('id', Number(itemId))
          .single();

        if (error) throw error;
        
        if (data) {
          setItem(data);
          setFormData({
            name: data.name,
            category: data.category_name || 'Signatures',
            price: data.price,
            stock: data.stock,
            description: data.description || '',
            image_url: data.image_url || '',
          });
        }
      } catch (err: any) {
        console.error('Error fetching item:', err);
        toast.error('Gagal memuat data item');
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [itemId]);

  const handleImageClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleRemoveImage = useCallback(() => {
    setFormData(prev => ({ ...prev, image_url: '' }));
    setCompressionInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleImageChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 10MB');
      return;
    }

    try {
      setUploadingImage(true);
      setCompressionInfo(null);

      // Show compression message
      toast.loading('Mengompresi gambar...', { id: 'compress' });

      // Compress image
      const { blob, dataUrl, originalSize, compressedSize } = await autoCompressImage(file, 1);
      
      toast.dismiss('compress');
      setCompressionInfo({ original: originalSize, compressed: compressedSize });
      
      // Show compression result
      const compressionRatio = Math.round((1 - blob.size / file.size) * 100);
      toast.success(`Gambar dikompresi dari ${originalSize} ke ${compressedSize} (${compressionRatio}%)`);

      // Upload compressed image to Supabase Storage
      const fileExt = 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `menu-items/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg'
        });

      if (uploadError) {
        console.log('Storage upload failed, using data URL:', uploadError);
        // Fallback: Use data URL directly
        setFormData(prev => ({ ...prev, image_url: dataUrl }));
        toast.success('Gambar disimpan (mode lokal)');
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      toast.success('Gambar berhasil diupload');

    } catch (err: any) {
      console.error('Error processing image:', err);
      toast.error('Gagal proses gambar: ' + err.message);
    } finally {
      setUploadingImage(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!itemId) return;
    
    try {
      setSaving(true);

      const { error } = await supabase
        .from('menu_items')
        .update({
          name: formData.name,
          category_name: formData.category,
          price: formData.price,
          stock: formData.stock,
          description: formData.description,
          image_url: formData.image_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', Number(itemId));

      if (error) throw error;

      toast.success('Perubahan berhasil disimpan!');
      // Clear cache dan navigate dengan reload
      clearMenuCache();
      navigate('/admin/stock', { replace: true });
      window.location.reload();
    } catch (err: any) {
      console.error('Error saving item:', err);
      toast.error('Gagal menyimpan: ' + err.message);
    } finally {
      setSaving(false);
    }
  }, [formData, itemId, navigate]);

  const handleDelete = useCallback(async () => {
    if (!itemId) return;
    if (!confirm('Apakah Anda yakin ingin menghapus item ini?')) return;

    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', Number(itemId));

      if (error) throw error;

      toast.success('Item berhasil dihapus!');
      // Clear cache dan navigate dengan reload
      clearMenuCache();
      navigate('/admin/stock', { replace: true });
      window.location.reload();
    } catch (err: any) {
      console.error('Error deleting item:', err);
      toast.error('Gagal menghapus: ' + err.message);
    }
  }, [itemId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <Navbar3D title="Edit Item" />
        <div className="px-5 py-4">
          {/* Image skeleton */}
          <div className="w-full h-56 bg-gray-200 rounded-3xl mb-4 animate-pulse" />
          {/* Form skeleton */}
          <div className="space-y-4">
            <div className="h-14 bg-gray-200 rounded-2xl animate-pulse" />
            <div className="h-10 w-full bg-gray-200 rounded-full animate-pulse" />
            <div className="flex gap-4">
              <div className="h-14 flex-1 bg-gray-200 rounded-2xl animate-pulse" />
              <div className="h-14 flex-1 bg-gray-200 rounded-2xl animate-pulse" />
            </div>
            <div className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Item tidak ditemukan</p>
          <motion.button 
            onClick={() => navigate('/admin/stock')}
            className="mt-4 px-6 py-3 bg-orange-500 text-white rounded-2xl font-medium"
            style={{ boxShadow: '0 6px 0 0 #C2410C, 0 8px 16px rgba(249, 115, 22, 0.4)' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Kembali
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Header 3D */}
      <Navbar3D 
        title="Edit Item"
        backTo="/admin/stock"
      />

      <main className="px-5 py-4 pb-52">
        {/* Image Upload */}
        <div className="mb-6">
          <div className="relative w-full h-56 bg-orange-50 rounded-3xl overflow-hidden border-2 border-orange-100">
            {formData.image_url ? (
              <>
                <img 
                  src={formData.image_url} 
                  alt={formData.name}
                  className="w-full h-full object-cover"
                />
                {/* Remove button */}
                <motion.button
                  onClick={handleRemoveImage}
                  className="absolute top-3 right-3 w-10 h-10 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-all"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-orange-300">
                <ImageIcon className="w-16 h-16 mb-2" />
                <span className="text-sm">Belum ada foto</span>
              </div>
            )}
            
            <div className="absolute inset-0 bg-black/20 flex items-end justify-center pb-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
              <motion.button 
                onClick={handleImageClick}
                disabled={uploadingImage}
                className="flex items-center gap-2 bg-white hover:bg-gray-50 disabled:opacity-50 px-5 py-2.5 rounded-full text-sm font-semibold text-gray-800 shadow-lg transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {uploadingImage ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    MENGOMPRESI...
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    {formData.image_url ? 'GANTI FOTO' : 'TAMBAH FOTO'}
                  </>
                )}
              </motion.button>
            </div>
          </div>
          
          {/* Compression info */}
          {compressionInfo && (
            <motion.div 
              className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-xl"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-sm text-orange-700 font-medium">✓ Kompresi berhasil</p>
              <p className="text-xs text-orange-600 mt-1">
                {compressionInfo.original} → {compressionInfo.compressed}
              </p>
            </motion.div>
          )}
          
          {/* URL Input */}
          <div className="mt-3">
            <label className="text-xs text-orange-600 font-medium uppercase">Atau masukkan URL gambar:</label>
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="flex-1 h-12 px-4 text-sm bg-white border-2 border-orange-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Item Name */}
          <div className="space-y-2">
            <label className="text-orange-600 text-xs uppercase tracking-wider font-semibold">
              ITEM NAME
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full h-14 text-lg bg-white border-2 border-orange-100 rounded-2xl px-4 focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 text-gray-800 transition-all"
              placeholder="Nama menu..."
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-orange-600 text-xs uppercase tracking-wider font-semibold">
              CATEGORY
            </label>
            <div className="flex gap-2 flex-wrap">
              {availableCategories.map((cat) => (
                <motion.button
                  key={cat}
                  onClick={() => setFormData({ ...formData, category: cat })}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                    formData.category === cat
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-200'
                      : 'bg-white text-gray-600 border-2 border-orange-100 hover:border-orange-300'
                  }`}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {cat}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Price & Inventory */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-orange-600 text-xs uppercase tracking-wider font-semibold">
                PRICE (Rp)
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className="w-full h-14 px-4 text-lg bg-white border-2 border-orange-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 text-gray-800 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-orange-600 text-xs uppercase tracking-wider font-semibold">
                INVENTORY
              </label>
              <div className="flex items-center gap-3">
                <motion.button
                  onClick={() => setFormData({ ...formData, stock: Math.max(0, formData.stock - 1) })}
                  className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-lg transition-all"
                  style={{ boxShadow: '0 4px 0 0 #C2410C, 0 6px 12px rgba(249, 115, 22, 0.4)' }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95, y: 2 }}
                >
                  <Minus className="w-5 h-5" />
                </motion.button>
                <span className="flex-1 text-center text-2xl font-bold text-gray-800">
                  {formData.stock}
                </span>
                <motion.button
                  onClick={() => setFormData({ ...formData, stock: formData.stock + 1 })}
                  className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-lg transition-all"
                  style={{ boxShadow: '0 4px 0 0 #C2410C, 0 6px 12px rgba(249, 115, 22, 0.4)' }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95, y: 2 }}
                >
                  <Plus className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-orange-600 text-xs uppercase tracking-wider font-semibold">
              DESCRIPTION
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full text-base bg-white border-2 border-orange-100 rounded-2xl p-4 focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 text-gray-600 resize-none transition-all"
              placeholder="Deskripsi menu..."
            />
          </div>
        </div>
      </main>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-orange-100 p-5">
        <motion.button
          onClick={handleSave}
          disabled={saving || uploadingImage}
          className="w-full h-14 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-lg font-semibold rounded-2xl mb-3 flex items-center justify-center gap-2 disabled:opacity-50"
          style={{
            boxShadow: saving ? 'none' : '0 6px 0 0 #C2410C, 0 8px 24px rgba(249, 115, 22, 0.4)'
          }}
          whileHover={saving ? {} : { scale: 1.02, y: -2 }}
          whileTap={saving ? {} : { scale: 0.98, y: 4 }}
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {saving ? 'SAVING...' : 'SAVE CHANGES'}
        </motion.button>
        <motion.button
          onClick={handleDelete}
          className="w-full h-14 border-2 border-red-500 text-red-500 hover:bg-red-50 text-lg font-semibold rounded-2xl flex items-center justify-center gap-2 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Trash2 className="w-5 h-5" />
          DELETE ITEM
        </motion.button>
      </div>
    </div>
  );
}
