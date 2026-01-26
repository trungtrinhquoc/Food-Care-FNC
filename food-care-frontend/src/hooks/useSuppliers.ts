import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { suppliersApi } from '../services/suppliersApi';
import type { Supplier, CreateSupplierRequest, UpdateSupplierRequest, SupplierFilter } from '../types/supplier';

export function useSuppliers(initialFilter: SupplierFilter = {}) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<SupplierFilter>({ page: 1, pageSize: 10, ...initialFilter });
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await suppliersApi.getSuppliers(filter);
      setSuppliers(result.items);
      setTotalCount(result.totalItems);
      setTotalPages(result.totalPages);
    } catch (error) {
      toast.error('Không thể tải danh sách nhà cung cấp');
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const createSupplier = useCallback(async (data: CreateSupplierRequest) => {
    try {
      const newSupplier = await suppliersApi.createSupplier(data);
      setSuppliers(prev => [newSupplier, ...prev]);
      setTotalCount(prev => prev + 1);
      toast.success('Thêm nhà cung cấp thành công!');
      return newSupplier;
    } catch (error) {
      toast.error('Không thể thêm nhà cung cấp');
      console.error('Error creating supplier:', error);
      throw error;
    }
  }, []);

  const updateSupplier = useCallback(async (id: number, data: UpdateSupplierRequest) => {
    try {
      const updatedSupplier = await suppliersApi.updateSupplier(id, data);
      setSuppliers(prev => prev.map(s => s.id === id.toString() ? updatedSupplier : s));
      toast.success('Cập nhật nhà cung cấp thành công!');
      return updatedSupplier;
    } catch (error) {
      toast.error('Không thể cập nhật nhà cung cấp');
      console.error('Error updating supplier:', error);
      throw error;
    }
  }, []);

  const deleteSupplier = useCallback(async (id: number) => {
    try {
      await suppliersApi.deleteSupplier(id);
      setSuppliers(prev => prev.filter(s => s.id !== id.toString()));
      setTotalCount(prev => prev - 1);
      toast.success('Xóa nhà cung cấp thành công!');
    } catch (error) {
      toast.error('Không thể xóa nhà cung cấp');
      console.error('Error deleting supplier:', error);
      throw error;
    }
  }, []);

  const updateFilter = useCallback((newFilter: Partial<SupplierFilter>) => {
    setFilter(prev => ({ ...prev, ...newFilter }));
  }, []);

  const resetFilter = useCallback(() => {
    setFilter({ page: 1, pageSize: 10, ...initialFilter });
  }, [initialFilter]);

  return {
    suppliers,
    loading,
    filter,
    totalCount,
    totalPages,
    fetchSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    updateFilter,
    resetFilter
  };
}
