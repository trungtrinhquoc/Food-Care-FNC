using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FoodCare.API.Models;

[Table("chat_messages")]
public class ChatMessage
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [Column("conversation_id")]
    public Guid ConversationId { get; set; }

    [Required]
    [Column("role")]
    [MaxLength(20)]
    public string Role { get; set; } = null!; // "user" or "assistant"

    [Required]
    [Column("content", TypeName = "text")]
    public string Content { get; set; } = null!;

    [Column("intent")]
    [MaxLength(50)]
    public string? Intent { get; set; }

    [Column("metadata", TypeName = "jsonb")]
    public string? Metadata { get; set; } // JSON string: product IDs, order IDs, etc.

    [Column("tokens_used")]
    public int? TokensUsed { get; set; } // Track token usage for this message

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("ConversationId")]
    public virtual ChatConversation Conversation { get; set; } = null!;
}
