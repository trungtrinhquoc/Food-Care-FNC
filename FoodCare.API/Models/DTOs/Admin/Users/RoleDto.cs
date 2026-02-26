namespace FoodCare.API.Models.DTOs.Admin.Users;

/// <summary>
/// DTO representing a user role option
/// </summary>
public class RoleDto
{
    /// <summary>
    /// The role value (enum name)
    /// </summary>
    public string Value { get; set; } = string.Empty;

    /// <summary>
    /// Display label in Vietnamese
    /// </summary>
    public string Label { get; set; } = string.Empty;

    /// <summary>
    /// Optional description
    /// </summary>
    public string? Description { get; set; }
}
