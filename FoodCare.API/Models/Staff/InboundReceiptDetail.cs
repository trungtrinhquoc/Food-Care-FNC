using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace FoodCare.API.Models.Staff;

/// <summary>
/// Chi tiết dòng hàng trong phiếu nhập - line item within an inbound receipt.
/// Each detail = one product line with quantity and pricing.
/// </summary>
[Table("inbound_receipt_details")]
[Index("ReceiptId", Name = "ix_inbound_receipt_details_receipt_id")]
[Index("ProductId", Name = "ix_inbound_receipt_details_product_id")]
public class InboundReceiptDetail
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Column("receipt_id")]
    public Guid ReceiptId { get; set; }

    [Column("product_id")]
    public Guid ProductId { get; set; }

    /// <summary>Denormalized product name for display</summary>
    [StringLength(300)]
    [Column("product_name")]
    public string? ProductName { get; set; }

    [Column("quantity")]
    public int Quantity { get; set; }

    /// <summary>Đơn giá nhập</summary>
    [Column("unit_price", TypeName = "decimal(18,2)")]
    public decimal UnitPrice { get; set; }

    /// <summary>Thành tiền = Quantity * UnitPrice</summary>
    [Column("line_total", TypeName = "decimal(18,2)")]
    public decimal LineTotal { get; set; }

    /// <summary>Đơn vị tính</summary>
    [StringLength(50)]
    [Column("unit")]
    public string? Unit { get; set; }

    [StringLength(100)]
    [Column("batch_number")]
    public string? BatchNumber { get; set; }

    [Column("expiry_date")]
    public DateTime? ExpiryDate { get; set; }

    [Column("manufacture_date")]
    public DateTime? ManufactureDate { get; set; }

    [StringLength(500)]
    [Column("note")]
    public string? Note { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("ReceiptId")]
    public virtual InboundReceipt Receipt { get; set; } = null!;

    [ForeignKey("ProductId")]
    public virtual Product Product { get; set; } = null!;
}
