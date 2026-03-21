// =============================================
// ADMIN SERVICES INDEX - Clean Architecture
// =============================================

// Re-export all admin services
export { default as customersService } from './customersService';
export { default as customerLogsService } from './customerLogsService';
export { usersService } from './usersService';
export { reviewsService } from './reviewsService';
export { ordersService } from './ordersService';
export { default as suppliersService } from './suppliersService';
export { default as adminProductsService } from './adminProductsService';
export { complaintsService } from './complaintsService';
export { financeService } from './financeService';
export { alertsService } from './alertsService';
export { zaloService } from './zaloService';
export { adminCommissionService } from './adminCommissionService';
export { adminBlindBoxService } from './adminBlindBoxService';
export { adminCouponsService } from './adminCouponsService';

// Re-export individual functions for convenience
export * from './customersService';
export * from './customerLogsService';
export * from './usersService';
export * from './reviewsService';
export * from './ordersService';
export * from './suppliersService';
export * from './adminProductsService';
export * from './complaintsService';
export * from './financeService';
export * from './alertsService';
export * from './zaloService';
export * from './adminCommissionService';
export * from './adminBlindBoxService';
export * from './adminCouponsService';
