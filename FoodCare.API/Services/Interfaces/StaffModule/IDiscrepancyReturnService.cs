using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FoodCare.API.Models.DTOs.Staff;

namespace FoodCare.API.Services.Interfaces.StaffModule;

public interface IDiscrepancyService
{
    Task<PagedResponse<DiscrepancyReportDto>> GetDiscrepanciesAsync(int page, int pageSize, Guid? receiptId, string? status, Guid? warehouseId = null);
    Task<DiscrepancyReportDto?> GetDiscrepancyByIdAsync(Guid id);
    Task<IEnumerable<DiscrepancyReportDto>> GetDiscrepanciesByReceiptAsync(Guid receiptId);
    Task<DiscrepancyReportDto> CreateDiscrepancyAsync(CreateDiscrepancyReportRequest request, Guid staffId);
    Task<DiscrepancyReportDto?> AddDiscrepancyItemAsync(Guid reportId, AddDiscrepancyItemRequest request);
    Task<DiscrepancyReportDto?> UpdateDiscrepancyItemAsync(Guid reportId, Guid itemId, UpdateDiscrepancyItemRequest request);
    Task<DiscrepancyReportDto?> SubmitDiscrepancyAsync(Guid id);
    Task<DiscrepancyReportDto?> ApproveDiscrepancyAsync(Guid id, ApproveDiscrepancyRequest request, Guid staffId);
    Task<DiscrepancyReportDto?> RejectDiscrepancyAsync(Guid id, RejectDiscrepancyRequest request, Guid staffId);
    Task<DiscrepancyReportDto?> ResolveDiscrepancyAsync(Guid id, ResolveDiscrepancyRequest request, Guid staffId);
    Task<object> GetDiscrepancyStatsAsync(Guid? warehouseId = null);
}

public interface IReturnService
{
    Task<PagedResponse<ReturnShipmentDto>> GetReturnsAsync(int page, int pageSize, Guid? supplierId, string? status, Guid? warehouseId = null);
    Task<ReturnShipmentDto?> GetReturnByIdAsync(Guid id);
    Task<IEnumerable<ReturnShipmentDto>> GetReturnsByDiscrepancyAsync(Guid discrepancyId);
    Task<ReturnShipmentDto> CreateReturnAsync(CreateReturnShipmentRequest request, Guid staffId);
    Task<ReturnShipmentDto?> AddReturnItemAsync(Guid returnId, AddReturnItemRequest request);
    Task<ReturnShipmentDto?> UpdateReturnItemAsync(Guid returnId, Guid itemId, UpdateReturnItemRequest request);
    Task<ReturnShipmentDto?> RemoveReturnItemAsync(Guid returnId, Guid itemId);
    Task<ReturnShipmentDto?> SubmitReturnAsync(Guid id);
    Task<ReturnShipmentDto?> DispatchReturnAsync(Guid id, DispatchReturnRequest request, Guid staffId);
    Task<ReturnShipmentDto?> ConfirmReceivedAsync(Guid id, ConfirmReturnReceivedRequest request);
    Task<ReturnShipmentDto?> RecordCreditAsync(Guid id, RecordCreditRequest request);
    Task<ReturnShipmentDto?> CloseReturnAsync(Guid id);
    Task<ReturnShipmentDto?> CancelReturnAsync(Guid id, CancelReturnRequest request);
    Task<object> GetReturnStatsAsync(Guid? supplierId, Guid? warehouseId = null);
}
