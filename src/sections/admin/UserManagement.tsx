import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Plus, Edit2, Trash2, X, Check, Loader2, 
  Shield, UserCircle, Search, RefreshCw 
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Navbar3D } from '@/components/Navbar3D';
import { Badge } from '@/components/ui/badge';

interface User {
  id: number;
  username: string;
  name: string;
  role: 'admin' | 'kasir';
  is_active: boolean;
  created_at: string;
}

const button3D = '0 4px 0 0 #C2410C, 0 4px 8px rgba(249, 115, 22, 0.4)';
const button3DGreen = '0 4px 0 0 #15803D, 0 4px 8px rgba(34, 197, 94, 0.4)';
const button3DRed = '0 4px 0 0 #DC2626, 0 4px 8px rgba(239, 68, 68, 0.4)';

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'kasir' as 'admin' | 'kasir',
    is_active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast.error('Gagal memuat data user');
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingUser) {
        // Update user
        const updateData: any = {
          username: formData.username,
          name: formData.name,
          role: formData.role,
          is_active: formData.is_active
        };
        
        // Only update password if provided
        if (formData.password) {
          updateData.password_hash = formData.password;
        }

        const { error } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', editingUser.id);

        if (error) throw error;
        toast.success('User berhasil diupdate');
      } else {
        // Create new user
        const { error } = await supabase
          .from('users')
          .insert([{
            username: formData.username,
            password_hash: formData.password,
            name: formData.name,
            role: formData.role,
            is_active: formData.is_active
          }]);

        if (error) throw error;
        toast.success('User berhasil ditambahkan');
      }

      setShowModal(false);
      setEditingUser(null);
      resetForm();
      loadUsers();
    } catch (error: any) {
      toast.error('Gagal menyimpan user: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Yakin ingin menghapus user "${user.name}"?`)) return;

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', user.id);

    if (error) {
      toast.error('Gagal menghapus user');
    } else {
      toast.success('User berhasil dihapus');
      loadUsers();
    }
  };

  const openAddModal = () => {
    setEditingUser(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      name: user.name,
      role: user.role,
      is_active: user.is_active
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      name: '',
      role: 'kasir',
      is_active: true
    });
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <Navbar3D 
        title="Manajemen User"
        rightContent={
          <motion.button 
            onClick={loadUsers}
            disabled={loading}
            className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 disabled:opacity-50"
            whileHover={{ scale: loading ? 1 : 1.1, rotate: loading ? 0 : 180 }}
            whileTap={{ scale: loading ? 1 : 0.9 }}
            style={{ boxShadow: '0 3px 0 0 rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.2)' }}
          >
            <RefreshCw className={`w-5 h-5 text-white ${loading ? 'animate-spin' : ''}`} />
          </motion.button>
        }
      />

      <main className="px-5 py-4 pb-24">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <motion.div 
            className="bg-white rounded-2xl p-4"
            style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 8px 16px -4px rgba(249, 115, 22, 0.1)' }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{users.length}</p>
                <p className="text-sm text-gray-500">Total User</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="bg-white rounded-2xl p-4"
            style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 8px 16px -4px rgba(249, 115, 22, 0.1)' }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{users.filter(u => u.role === 'admin').length}</p>
                <p className="text-sm text-gray-500">Admin</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Search & Add */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-white rounded-xl border border-orange-200 focus:outline-none focus:border-orange-500"
            />
          </div>
          <motion.button
            onClick={openAddModal}
            className="h-12 px-4 bg-orange-500 text-white rounded-xl font-medium flex items-center gap-2"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            style={{ boxShadow: button3D }}
          >
            <Plus className="w-5 h-5" />
            Tambah
          </motion.button>
        </div>

        {/* Users List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48">
            <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
            <p className="text-gray-500">Memuat data...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Tidak ada user</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((user, index) => (
              <motion.div
                key={user.id}
                className="bg-white rounded-2xl p-4"
                style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 8px 16px -4px rgba(249, 115, 22, 0.1)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      user.role === 'admin' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      {user.role === 'admin' ? (
                        <Shield className="w-6 h-6 text-blue-600" />
                      ) : (
                        <UserCircle className="w-6 h-6 text-green-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{user.name}</h3>
                      <p className="text-sm text-gray-500">@{user.username}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={user.role === 'admin' ? 'bg-blue-500' : 'bg-green-500'}>
                          {user.role.toUpperCase()}
                        </Badge>
                        <Badge className={user.is_active ? 'bg-green-500' : 'bg-gray-400'}>
                          {user.is_active ? 'AKTIF' : 'NONAKTIF'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => openEditModal(user)}
                      className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Edit2 className="w-5 h-5" />
                    </motion.button>
                    <motion.button
                      onClick={() => handleDelete(user)}
                      className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Trash2 className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
            <motion.div
              className="relative bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {editingUser ? 'Edit User' : 'Tambah User'}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-12 px-4 bg-white border-2 border-orange-200 rounded-xl focus:outline-none focus:border-orange-500"
                    placeholder="Nama user"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingUser}
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                    className="w-full h-12 px-4 bg-white border-2 border-orange-200 rounded-xl focus:outline-none focus:border-orange-500 disabled:bg-gray-100"
                    placeholder="username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password {editingUser && '(Kosongkan jika tidak diubah)'}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full h-12 px-4 bg-white border-2 border-orange-200 rounded-xl focus:outline-none focus:border-orange-500"
                    placeholder={editingUser ? '••••••••' : 'Password'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'admin' })}
                      className={`h-12 rounded-xl flex items-center justify-center gap-2 font-medium transition-all ${
                        formData.role === 'admin'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                      style={formData.role === 'admin' ? { boxShadow: '0 4px 0 0 #1E40AF' } : {}}
                    >
                      <Shield className="w-5 h-5" />
                      Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'kasir' })}
                      className={`h-12 rounded-xl flex items-center justify-center gap-2 font-medium transition-all ${
                        formData.role === 'kasir'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                      style={formData.role === 'kasir' ? { boxShadow: '0 4px 0 0 #15803D' } : {}}
                    >
                      <UserCircle className="w-5 h-5" />
                      Kasir
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, is_active: true })}
                      className={`h-12 rounded-xl flex items-center justify-center gap-2 font-medium transition-all ${
                        formData.is_active
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                      style={formData.is_active ? { boxShadow: button3DGreen } : {}}
                    >
                      <Check className="w-5 h-5" />
                      Aktif
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, is_active: false })}
                      className={`h-12 rounded-xl flex items-center justify-center gap-2 font-medium transition-all ${
                        !formData.is_active
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                      style={!formData.is_active ? { boxShadow: button3DRed } : {}}
                    >
                      <X className="w-5 h-5" />
                      Nonaktif
                    </button>
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-14 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-2xl mt-6 disabled:opacity-50"
                  whileHover={{ scale: isSubmitting ? 1 : 1.02, y: isSubmitting ? 0 : -2 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                  style={{ boxShadow: isSubmitting ? 'none' : button3D }}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Menyimpan...
                    </span>
                  ) : (
                    editingUser ? 'Update User' : 'Tambah User'
                  )}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
