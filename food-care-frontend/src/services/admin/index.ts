// =============================================
// ADMIN SERVICES INDEX - Clean Architecture
// =============================================

// Re-export all admin services
export { default as customersService } from './customersService';
export { default as customerLogsService } from './customerLogsService';
export { usersService } from './usersService';
export { reviewsService } from './reviewsService';
export { ordersService } from './ordersService';

// Re-export individual functions for convenience
export * from './customersService';
export * from './customerLogsService';
export * from './usersService';
export * from './reviewsService';
export * from './ordersService';
