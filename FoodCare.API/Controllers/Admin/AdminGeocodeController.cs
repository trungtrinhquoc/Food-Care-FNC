using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FoodCare.API.Models;
using FoodCare.API.Services.Interfaces;

namespace FoodCare.API.Controllers.Admin;

/// <summary>
/// Admin endpoint to backfill missing geocode data (latitude/longitude) 
/// for existing suppliers and warehouses using Nominatim geocoding.
/// </summary>
[ApiController]
[Route("api/admin/geocode")]
[Authorize(Roles = "admin")]
public class AdminGeocodeController : ControllerBase
{
    private readonly FoodCareDbContext _context;
    private readonly IGeocodingService _geocodingService;

    public AdminGeocodeController(FoodCareDbContext context, IGeocodingService geocodingService)
    {
        _context = context;
        _geocodingService = geocodingService;
    }

    /// <summary>
    /// Backfill missing lat/lng for all suppliers and warehouses that have address but no coordinates.
    /// Rate-limited by Nominatim (1 req/s), so this may take a while for large datasets.
    /// </summary>
    [HttpPost("backfill")]
    public async Task<ActionResult> BackfillGeocode()
    {
        var results = new
        {
            suppliersProcessed = 0,
            suppliersUpdated = 0,
            suppliersFailed = 0,
            warehousesProcessed = 0,
            warehousesUpdated = 0,
            warehousesFailed = 0
        };

        // --- Suppliers ---
        var suppliersToGeocode = await _context.Suppliers
            .Where(s => s.IsDeleted == false
                && s.AddressCity != null
                && (!s.Latitude.HasValue || !s.Longitude.HasValue))
            .ToListAsync();

        int sProcessed = 0, sUpdated = 0, sFailed = 0;

        foreach (var supplier in suppliersToGeocode)
        {
            sProcessed++;
            try
            {
                var (lat, lng) = await _geocodingService.GeocodeAddressAsync(
                    supplier.AddressWard, supplier.AddressDistrict, supplier.AddressCity);
                if (lat.HasValue && lng.HasValue)
                {
                    supplier.Latitude = lat.Value;
                    supplier.Longitude = lng.Value;
                    supplier.UpdatedAt = DateTime.UtcNow;
                    sUpdated++;
                }
                else
                {
                    sFailed++;
                }
            }
            catch
            {
                sFailed++;
            }
        }

        // --- Warehouses ---
        var warehousesToGeocode = await _context.Warehouses
            .Where(w => w.AddressCity != null
                && (!w.Latitude.HasValue || !w.Longitude.HasValue))
            .ToListAsync();

        int wProcessed = 0, wUpdated = 0, wFailed = 0;

        foreach (var warehouse in warehousesToGeocode)
        {
            wProcessed++;
            try
            {
                var (lat, lng) = await _geocodingService.GeocodeAddressAsync(
                    warehouse.AddressWard, warehouse.AddressDistrict, warehouse.AddressCity);
                if (lat.HasValue && lng.HasValue)
                {
                    warehouse.Latitude = lat.Value;
                    warehouse.Longitude = lng.Value;
                    warehouse.UpdatedAt = DateTime.UtcNow;
                    wUpdated++;
                }
                else
                {
                    wFailed++;
                }
            }
            catch
            {
                wFailed++;
            }
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Geocode backfill completed",
            suppliers = new { processed = sProcessed, updated = sUpdated, failed = sFailed },
            warehouses = new { processed = wProcessed, updated = wUpdated, failed = wFailed }
        });
    }

    /// <summary>
    /// Get a summary of how many suppliers/warehouses are missing coordinates.
    /// </summary>
    [HttpGet("status")]
    public async Task<ActionResult> GetGeocodeStatus()
    {
        var suppliersTotal = await _context.Suppliers.Where(s => s.IsDeleted == false).CountAsync();
        var suppliersMissing = await _context.Suppliers
            .Where(s => s.IsDeleted == false
                && s.AddressCity != null
                && (!s.Latitude.HasValue || !s.Longitude.HasValue))
            .CountAsync();

        var warehousesTotal = await _context.Warehouses.CountAsync();
        var warehousesMissing = await _context.Warehouses
            .Where(w => w.AddressCity != null
                && (!w.Latitude.HasValue || !w.Longitude.HasValue))
            .CountAsync();

        return Ok(new
        {
            suppliers = new { total = suppliersTotal, missingCoordinates = suppliersMissing },
            warehouses = new { total = warehousesTotal, missingCoordinates = warehousesMissing }
        });
    }
}
