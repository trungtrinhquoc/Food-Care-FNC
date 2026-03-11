// =============================================
// ADMIN DELIVERY GOVERNANCE API SERVICE
// =============================================

import api from '../api';
import type { PagedResult } from '@/types/admin';
import type {
  AdminDeliverySummary,
  AdminDeliveryDetail,
  AdminActionLog,
  DeliveryKpi,
  DeliveryFilterParams,
  AuditLogFilterParams,
} from '@/types/shipping';

const BASE = '/admin/deliveries';

// =====================================================
// DELIVERY QUERIES
// =====================================================

export const adminDeliveryApi = {
  /** Get all deliveries with filters */
  getDeliveries: async (params: DeliveryFilterParams = {}): Promise<PagedResult<AdminDeliverySummary>> => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.pageSize) searchParams.append('pageSize', params.pageSize.toString());
    if (params.status) searchParams.append('status', params.status);
    if (params.warehouseId) searchParams.append('warehouseId', params.warehouseId);
    if (params.supplierId) searchParams.append('supplierId', params.supplierId.toString());
    if (params.fromDate) searchParams.append('fromDate', params.fromDate);
    if (params.toDate) searchParams.append('toDate', params.toDate);
    if (params.search) searchParams.append('search', params.search);
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortDescending) searchParams.append('sortDescending', 'true');

    const response = await api.get<PagedResult<AdminDeliverySummary>>(`${BASE}?${searchParams}`);
    return response.data;
  },

  /** Get deliveries pending admin approval */
  getPendingDeliveries: async (page = 1, pageSize = 20): Promise<PagedResult<AdminDeliverySummary>> => {
    const response = await api.get<PagedResult<AdminDeliverySummary>>(
      `${BASE}/pending?page=${page}&pageSize=${pageSize}`
    );
    return response.data;
  },

  /** Get delivery detail with full governance info */
  getDeliveryDetail: async (id: string): Promise<AdminDeliveryDetail> => {
    const response = await api.get<AdminDeliveryDetail>(`${BASE}/${id}`);
    return response.data;
  },

  // =====================================================
  // ADMIN ACTIONS
  // =====================================================

  /** Delete a shipment */
  deleteShipment: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`);
  },

  /** Delete an inbound session */
  deleteSession: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/sessions/${id}`);
  },

  // =====================================================
  // AUDIT LOG
  // =====================================================

  /** Get audit log entries */
  getAuditLog: async (params: AuditLogFilterParams = {}): Promise<PagedResult<AdminActionLog>> => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.pageSize) searchParams.append('pageSize', params.pageSize.toString());
    if (params.entityType) searchParams.append('entityType', params.entityType);
    if (params.entityId) searchParams.append('entityId', params.entityId);
    if (params.adminId) searchParams.append('adminId', params.adminId);
    if (params.action) searchParams.append('action', params.action);
    if (params.fromDate) searchParams.append('fromDate', params.fromDate);
    if (params.toDate) searchParams.append('toDate', params.toDate);

    const response = await api.get<PagedResult<AdminActionLog>>(`${BASE}/audit-log?${searchParams}`);
    return response.data;
  },

  // =====================================================
  // KPI
  // =====================================================

  /** Get KPI for a specific warehouse */
  getWarehouseKpi: async (warehouseId: string, from?: string, to?: string): Promise<DeliveryKpi> => {
    const searchParams = new URLSearchParams();
    if (from) searchParams.append('from', from);
    if (to) searchParams.append('to', to);
    const qs = searchParams.toString();

    const response = await api.get<DeliveryKpi>(`${BASE}/kpi/${warehouseId}${qs ? `?${qs}` : ''}`);
    return response.data;
  },

  /** Get KPIs for all warehouses */
  getAllWarehouseKpis: async (from?: string, to?: string): Promise<DeliveryKpi[]> => {
    const searchParams = new URLSearchParams();
    if (from) searchParams.append('from', from);
    if (to) searchParams.append('to', to);
    const qs = searchParams.toString();

    const response = await api.get<DeliveryKpi[]>(`${BASE}/kpi${qs ? `?${qs}` : ''}`);
    return response.data;
  },
};

export default adminDeliveryApi;
