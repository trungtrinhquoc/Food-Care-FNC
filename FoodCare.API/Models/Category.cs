using System;
using System.Collections.Generic;

namespace FoodCare.API.Models;

public partial class Category
{
    public int Id { get; set; }

    public int? ParentId { get; set; }

    public string Name { get; set; } = null!;

    public string Slug { get; set; } = null!;

    public string? ImageUrl { get; set; }

    public string? Description { get; set; }

    public bool? IsActive { get; set; }

    public DateTime? CreatedAt { get; set; }

    public string? NameVi { get; set; }

    public int? Level { get; set; }

    public string? IconName { get; set; }

    public string? BannerUrl { get; set; }

    public string? ColorCode { get; set; }

    public int? SortOrder { get; set; }

    public bool? IsFeatured { get; set; }

    public string? MetaTitle { get; set; }

    public string? MetaDescription { get; set; }

    public string? MetaKeywords { get; set; }

    public int? ProductCount { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<Category> InverseParent { get; set; } = new List<Category>();

    public virtual Category? Parent { get; set; }

    public virtual ICollection<Product> Products { get; set; } = new List<Product>();
}
