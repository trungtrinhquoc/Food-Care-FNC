import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { Supplier, SupplierFormData } from '../types/admin';

export function useSuppliers(initialSuppliers: Supplier[]) {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierForm, setSupplierForm] = useState<SupplierFormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    contact: '',
    products: '',
  });

  const resetForm = useCallback(() => {
    setSupplierForm({
      name: '',
      email: '',
      phone: '',
      address: '',
      contact: '',
      products: '',
    });
  }, []);

  const openSupplierDialog = useCallback((supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setSupplierForm({
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        contact: supplier.contact,
        products: supplier.products.join(', '),
      });
    } else {
      setEditingSupplier(null);
      resetForm();
    }
    setIsSupplierDialogOpen(true);
  }, [resetForm]);

  const closeSupplierDialog = useCallback(() => {
    setIsSupplierDialogOpen(false);
    setEditingSupplier(null);
    resetForm();
  }, [resetForm]);

  const saveSupplier = useCallback(() => {
    if (!supplierForm.name || !supplierForm.email || !supplierForm.phone) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    const newSupplier: Supplier = {
      id: editingSupplier ? editingSupplier.id : `SUP-${String(suppliers.length + 1).padStart(3, '0')}`,
      name: supplierForm.name,
      email: supplierForm.email,
      phone: supplierForm.phone,
      address: supplierForm.address,
      contact: supplierForm.contact,
      products: supplierForm.products.split(',').map((p) => p.trim()),
      totalProducts: supplierForm.products.split(',').length,
      status: 'active',
    };

    if (editingSupplier) {
      setSuppliers(suppliers.map((s) => (s.id === editingSupplier.id ? newSupplier : s)));
      toast.success('Cập nhật nhà cung cấp thành công!');
    } else {
      setSuppliers([...suppliers, newSupplier]);
      toast.success('Thêm nhà cung cấp mới thành công!');
    }

    closeSupplierDialog();
  }, [supplierForm, editingSupplier, suppliers, closeSupplierDialog]);

  const deleteSupplier = useCallback((supplierId: string) => {
    setSuppliers(suppliers.filter((s) => s.id !== supplierId));
    toast.success('Đã xóa nhà cung cấp');
  }, [suppliers]);

  const updateSupplierForm = useCallback((field: keyof SupplierFormData, value: string) => {
    setSupplierForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  return {
    suppliers,
    isSupplierDialogOpen,
    editingSupplier,
    supplierForm,
    openSupplierDialog,
    closeSupplierDialog,
    saveSupplier,
    deleteSupplier,
    updateSupplierForm,
  };
}
