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

// Re-export individual functions for convenience
export * from './customersService';
export * from './customerLogsService';
export * from './usersService';
export * from './reviewsService';
export * from './ordersService';
export * from './suppliersService';
export * from './adminProductsService';
