using System;

namespace FoodCare.API.Helpers;

/// <summary>
/// Geographic distance calculations using the Haversine formula.
/// </summary>
public static class GeoHelper
{
    private const double EarthRadiusKm = 6371.0;

    /// <summary>
    /// Calculate the distance in kilometers between two (latitude, longitude) points
    /// using the Haversine formula.
    /// </summary>
    public static double CalculateDistanceKm(
        decimal lat1, decimal lon1,
        decimal lat2, decimal lon2)
    {
        var dLat = DegreesToRadians((double)(lat2 - lat1));
        var dLon = DegreesToRadians((double)(lon2 - lon1));

        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(DegreesToRadians((double)lat1)) *
                Math.Cos(DegreesToRadians((double)lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

        return EarthRadiusKm * c;
    }

    private static double DegreesToRadians(double degrees)
    {
        return degrees * Math.PI / 180.0;
    }
}
