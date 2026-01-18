using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FoodCare.API.Models
{
    [Table("otp_verifications")]
    public class OtpVerification
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; }

        [Required]
        [Column("phone_number")]
        [MaxLength(20)]
        public string PhoneNumber { get; set; } = null!;

        [Required]
        [Column("otp_code")]
        [MaxLength(6)]
        public string OtpCode { get; set; } = null!;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        [Column("expires_at")]
        public DateTime ExpiresAt { get; set; }

        [Column("is_verified")]
        public bool IsVerified { get; set; }

        [Column("attempt_count")]
        public int AttemptCount { get; set; }

        [Column("user_id")]
        public Guid? UserId { get; set; }
    }
}
