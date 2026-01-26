import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { supplierApi } from '../services/suppliersApi';
import type { 
  SupplierProfile, 
  SupplierProduct, 
  SupplierOrder, 
  SupplierStats,
  UpdateSupplierRequest 
} from '../types/supplier';

export function useSupplierAuth() {
  const [profile, setProfile] = useState<SupplierProfile | null>(null);
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [stats, setStats] = useState<SupplierStats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await supplierApi.getProfile();
      setProfile(data);
      return data;
    } catch (error) {
      toast.error('Không thể tải thông tin nhà cung cấp');
      console.error('Error fetching supplier profile:', error);
      throw error;
    }
  }, []);

  const updateProfile = useCallback(async (data: UpdateSupplierRequest) => {
    try {
      const updatedProfile = await supplierApi.updateProfile(data);
      setProfile(updatedProfile);
      toast.success('Cập nhật thông tin thành công!');
      return updatedProfile;
    } catch (error) {
      toast.error('Không thể cập nhật thông tin');
      console.error('Error updating supplier profile:', error);
      throw error;
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const data = await supplierApi.getProducts();
      setProducts(data);
      return data;
    } catch (error) {
      toast.error('Không thể tải danh sách sản phẩm');
      console.error('Error fetching supplier products:', error);
      throw error;
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await supplierApi.getOrders();
      setOrders(data);
      return data;
    } catch (error) {
      toast.error('Không thể tải danh sách đơn hàng');
      console.error('Error fetching supplier orders:', error);
      throw error;
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const data = await supplierApi.getStats();
      setStats(data);
      return data;
    } catch (error) {
      toast.error('Không thể tải thống kê');
      console.error('Error fetching supplier stats:', error);
      throw error;
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchProfile(),
        fetchProducts(),
        fetchOrders(),
        fetchStats()
      ]);
    } catch (error) {
      console.error('Error fetching supplier data:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchProfile, fetchProducts, fetchOrders, fetchStats]);

  return {
    profile,
    products,
    orders,
    stats,
    loading,
    fetchProfile,
    updateProfile,
    fetchProducts,
    fetchOrders,
    fetchStats,
    fetchAllData
  };
}
