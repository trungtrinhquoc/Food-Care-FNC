using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace FoodCare.API.Models.Staff;

/// <summary>
/// Documents attached to shipments (packing lists, COAs, etc.)
/// </summary>
[Table("shipment_documents")]
[Index("ShipmentId", Name = "ix_shipment_documents_shipment_id")]
[Index("DocumentType", Name = "ix_shipment_documents_type")]
public class ShipmentDocument
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Column("shipment_id")]
    public Guid ShipmentId { get; set; }

    [Required]
    [StringLength(50)]
    [Column("document_type")]
    public string DocumentType { get; set; } = null!; // packing_list, coa, invoice, etc.

    [Required]
    [StringLength(255)]
    [Column("file_name")]
    public string FileName { get; set; } = null!;

    [Required]
    [Column("file_url")]
    public string FileUrl { get; set; } = null!;

    [StringLength(100)]
    [Column("mime_type")]
    public string? MimeType { get; set; }

    [Column("file_size")]
    public long? FileSize { get; set; }

    [Column("uploaded_by")]
    public Guid? UploadedBy { get; set; }

    [Column("uploaded_at")]
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("ShipmentId")]
    public virtual SupplierShipment Shipment { get; set; } = null!;

    [ForeignKey("UploadedBy")]
    public virtual User? Uploader { get; set; }
}
