using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FoodCare.API.Models;

[Table("chat_conversations")]
public class ChatConversation
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [Column("user_id")]
    public Guid UserId { get; set; }

    [Column("title")]
    [MaxLength(200)]
    public string? Title { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Column("status")]
    [MaxLength(20)]
    public string Status { get; set; } = "active"; // "active", "archived"

    // Navigation properties
    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;

    public virtual ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
}
