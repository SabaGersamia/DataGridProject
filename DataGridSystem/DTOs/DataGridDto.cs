using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace DataGridSystem.DTOs
{
    public class DataGridDto
    {
        public int GridId { get; set; }
        [Required]
        [StringLength(100)]
        public string Name { get; set; }
        public bool IsPublic { get; set; }

        public List<ColumnDto> Columns { get; set; } = new List<ColumnDto>();

        public List<RowDto> Rows { get; set; } = new List<RowDto>();

        public List<string?> AllowedUsers { get; set; } = new List<string>();
    }

    public class ColumnDto
    {
        public int ColumnId { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Name { get; set; }
        
        [Required]
        public string DataType { get; set; }
        
        public bool IsRequired { get; set; }
        public string? ValidationPattern { get; set; }
        public List<string>? Options { get; set; }
        public string? ReferenceTable { get; set; }
        public string? ExternalCollectionUrl { get; set; }
    }

    public class RowDto
    {
        public int RowId { get; set; }
        public int GridId { get; set; }
        public Dictionary<string, string> Values { get; set; }
        public string? Status { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateRowDto
    {
        [Required]
        public Dictionary<string, string> Values { get; set; } = new();
        public string? Status { get; set; }
    }

    public class CreateColumnDto
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; }
        
        [Required]
        public string DataType { get; set; }
        
        public bool IsRequired { get; set; }
        public string? ValidationPattern { get; set; }
        public List<string>? Options { get; set; }
        public string? ReferenceTable { get; set; }
        public string? ExternalCollectionUrl { get; set; }
    }
}
