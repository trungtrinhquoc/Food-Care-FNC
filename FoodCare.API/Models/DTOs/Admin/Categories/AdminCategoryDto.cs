namespace FoodCare.API.Models.DTOs.Admin.Categories;

public class AdminCategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string? Description { get; set; }
    public int? ParentId { get; set; }
    public string? ParentName { get; set; }
    public bool IsActive { get; set; }
    public int ProductCount { get; set; }
    public DateTime? CreatedAt { get; set; }
}

public class CreateCategoryDto
{
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? ImageUrl { get; set; }
    public string? Description { get; set; }
    public int? ParentId { get; set; }
}

public class UpdateCategoryDto
{
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? ImageUrl { get; set; }
    public string? Description { get; set; }
    public int? ParentId { get; set; }
    public bool? IsActive { get; set; }
}

public class CategoryDropdownDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int? ParentId { get; set; }
}
