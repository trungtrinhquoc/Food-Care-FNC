using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FoodCare.API.Models;

[Table("chat_faqs")]
public class ChatFaq
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [Column("question_pattern")]
    [MaxLength(500)]
    public string QuestionPattern { get; set; } = null!; // Regex pattern

    [Required]
    [Column("answer", TypeName = "text")]
    public string Answer { get; set; } = null!;

    [Column("category")]
    [MaxLength(100)]
    public string? Category { get; set; }

    [Column("keywords")]
    public string[]? Keywords { get; set; }

    [Column("hit_count")]
    public int HitCount { get; set; } = 0;

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
