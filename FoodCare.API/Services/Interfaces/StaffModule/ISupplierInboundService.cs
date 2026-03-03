using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FoodCare.API.Models.DTOs.Staff;

namespace FoodCare.API.Services.Interfaces.StaffModule;

/// <summary>
/// Service for supplier-facing inbound session operations.
/// Handles supplier registration for sessions and district-based matching.
/// </summary>
public interface ISupplierInboundService
{
    /// <summary>Get inbound sessions available to a supplier (matching district)</summary>
    Task<List<SupplierInboundSessionDto>> GetAvailableSessionsForSupplierAsync(int supplierId);

    /// <summary>Register supplier for an inbound session</summary>
    Task<SupplierInboundSessionDto> RegisterForSessionAsync(
        Guid sessionId, int supplierId, SupplierRegisterInboundRequest request);

    /// <summary>Decline/cancel registration</summary>
    Task DeclineSessionAsync(Guid sessionId, int supplierId);

    /// <summary>Get supplier registrations for a specific session (admin view)</summary>
    Task<List<InboundSessionSupplierDto>> GetSessionSuppliersAsync(Guid sessionId);

    /// <summary>Invite suppliers in the same district as the warehouse when session is created</summary>
    Task InviteSuppliersForSessionAsync(Guid sessionId);
}
