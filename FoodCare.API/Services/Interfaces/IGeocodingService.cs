using System.Threading.Tasks;

namespace FoodCare.API.Services.Interfaces;

/// <summary>
/// Service for geocoding addresses into latitude/longitude coordinates.
/// </summary>
public interface IGeocodingService
{
    /// <summary>
    /// Geocode a Vietnamese address (ward, district, city) into coordinates.
    /// Returns null values if geocoding fails.
    /// </summary>
    Task<(decimal? Latitude, decimal? Longitude)> GeocodeAddressAsync(
        string? ward, string? district, string? city);
}
