using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FoodCare.API.Models.DTOs.Staff;
using FoodCare.API.Models.Staff;

namespace FoodCare.API.Services.Interfaces.StaffModule;

public interface IWarehouseService
{
    Task<PagedResponse<WarehouseDto>> GetWarehousesAsync(int page = 1, int pageSize = 20, bool? isActive = null);
    Task<WarehouseDto?> GetWarehouseByIdAsync(Guid id);
    Task<WarehouseDto?> GetWarehouseByCodeAsync(string code);
    Task<WarehouseDto> CreateWarehouseAsync(CreateWarehouseRequest request);
    Task<WarehouseDto?> UpdateWarehouseAsync(Guid id, UpdateWarehouseRequest request);
    Task<bool> DeleteWarehouseAsync(Guid id);
    Task<WarehouseDto?> GetDefaultWarehouseAsync();

    // Region-based auto-assignment
    Task<Warehouse?> GetWarehouseByRegionAsync(string region);

    // Staff warehouse access
    Task<List<Guid>> GetStaffWarehouseIdsAsync(Guid staffId);
    Task<bool> StaffHasWarehouseAccessAsync(Guid staffId, Guid warehouseId);
}

public interface IStaffMemberService
{
    Task<PagedResponse<StaffMemberDto>> GetStaffMembersAsync(int page = 1, int pageSize = 20, Guid? warehouseId = null, bool? isActive = null);
    Task<StaffMemberDto?> GetStaffMemberByIdAsync(Guid id);
    Task<StaffMemberDto?> GetStaffMemberByUserIdAsync(Guid userId);
    Task<StaffMemberDto?> GetStaffMemberByEmployeeCodeAsync(string employeeCode);
    Task<StaffMemberDto> CreateStaffMemberAsync(CreateStaffMemberRequest request);
    Task<StaffMemberDto?> UpdateStaffMemberAsync(Guid id, UpdateStaffMemberRequest request);
    Task<bool> DeleteStaffMemberAsync(Guid id);
    Task<bool> AssignToWarehouseAsync(Guid staffId, Guid warehouseId);
    Task<bool> HasPermissionAsync(Guid staffId, string permission);
    Task<List<Guid>> GetWarehouseIdsAsync(Guid userId);
}
