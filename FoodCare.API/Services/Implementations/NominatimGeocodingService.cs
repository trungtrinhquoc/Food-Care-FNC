using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using FoodCare.API.Services.Interfaces;

namespace FoodCare.API.Services.Implementations;

/// <summary>
/// Geocoding service using OpenStreetMap Nominatim API (free, no API key required).
/// Rate limit: max 1 request/second per Nominatim usage policy.
/// </summary>
public class NominatimGeocodingService : IGeocodingService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<NominatimGeocodingService> _logger;
    private static DateTime _lastRequestTime = DateTime.MinValue;
    private static readonly object _rateLimitLock = new();

    public NominatimGeocodingService(HttpClient httpClient, ILogger<NominatimGeocodingService> logger)
    {
        _httpClient = httpClient;
        _httpClient.BaseAddress = new Uri("https://nominatim.openstreetmap.org/");
        _httpClient.DefaultRequestHeaders.Add("User-Agent", "FoodCare-API/1.0 (contact@foodcare.vn)");
        _httpClient.DefaultRequestHeaders.Add("Accept-Language", "vi,en");
        _logger = logger;
    }

    public async Task<(decimal? Latitude, decimal? Longitude)> GeocodeAddressAsync(
        string? ward, string? district, string? city)
    {
        if (string.IsNullOrWhiteSpace(city))
            return (null, null);

        try
        {
            // Respect Nominatim's 1 req/s rate limit
            await RespectRateLimitAsync();

            // Build query: "Ward, District, City, Vietnam"
            var parts = new System.Collections.Generic.List<string>();
            if (!string.IsNullOrWhiteSpace(ward)) parts.Add(ward);
            if (!string.IsNullOrWhiteSpace(district)) parts.Add(district);
            parts.Add(city);
            parts.Add("Vietnam");

            var query = Uri.EscapeDataString(string.Join(", ", parts));
            var url = $"search?q={query}&format=json&limit=1&countrycodes=vn";

            var response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            var results = doc.RootElement;

            if (results.GetArrayLength() == 0)
            {
                _logger.LogWarning("Nominatim returned no results for: {Query}", string.Join(", ", parts));

                // Fallback: try with just district + city if ward search failed
                if (!string.IsNullOrWhiteSpace(ward))
                {
                    _logger.LogInformation("Retrying without ward: {District}, {City}", district, city);
                    await RespectRateLimitAsync();
                    return await GeocodeWithoutWardAsync(district, city);
                }

                return (null, null);
            }

            var first = results[0];
            var latStr = first.GetProperty("lat").GetString();
            var lonStr = first.GetProperty("lon").GetString();

            if (decimal.TryParse(latStr, System.Globalization.NumberStyles.Float,
                    System.Globalization.CultureInfo.InvariantCulture, out var lat) &&
                decimal.TryParse(lonStr, System.Globalization.NumberStyles.Float,
                    System.Globalization.CultureInfo.InvariantCulture, out var lon))
            {
                _logger.LogInformation(
                    "Geocoded '{Address}' → ({Lat}, {Lon})",
                    string.Join(", ", parts), lat, lon);
                return (lat, lon);
            }

            return (null, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Geocoding failed for: {Ward}, {District}, {City}", ward, district, city);
            return (null, null);
        }
    }

    private async Task<(decimal? Latitude, decimal? Longitude)> GeocodeWithoutWardAsync(
        string? district, string? city)
    {
        try
        {
            var parts = new System.Collections.Generic.List<string>();
            if (!string.IsNullOrWhiteSpace(district)) parts.Add(district);
            if (!string.IsNullOrWhiteSpace(city)) parts.Add(city);
            parts.Add("Vietnam");

            var query = Uri.EscapeDataString(string.Join(", ", parts));
            var url = $"search?q={query}&format=json&limit=1&countrycodes=vn";

            var response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            var results = doc.RootElement;

            if (results.GetArrayLength() == 0)
                return (null, null);

            var first = results[0];
            var latStr = first.GetProperty("lat").GetString();
            var lonStr = first.GetProperty("lon").GetString();

            if (decimal.TryParse(latStr, System.Globalization.NumberStyles.Float,
                    System.Globalization.CultureInfo.InvariantCulture, out var lat) &&
                decimal.TryParse(lonStr, System.Globalization.NumberStyles.Float,
                    System.Globalization.CultureInfo.InvariantCulture, out var lon))
            {
                return (lat, lon);
            }

            return (null, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Fallback geocoding failed for: {District}, {City}", district, city);
            return (null, null);
        }
    }

    private static async Task RespectRateLimitAsync()
    {
        lock (_rateLimitLock)
        {
            var elapsed = DateTime.UtcNow - _lastRequestTime;
            if (elapsed.TotalMilliseconds < 1100)
            {
                var delay = 1100 - (int)elapsed.TotalMilliseconds;
                System.Threading.Thread.Sleep(delay); // Blocking within lock is intentional for rate limiting
            }
            _lastRequestTime = DateTime.UtcNow;
        }

        await Task.CompletedTask;
    }
}
