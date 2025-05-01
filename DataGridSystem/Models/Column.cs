using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DataGridSystem.Models
{
    public class Column
    {
        public int ColumnId { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Name { get; set; }
        
        [Required]
        public string DataType { get; set; }
        
        public int GridId { get; set; }
        public DataGrid DataGrid { get; set; }
        
        public string? ValidationPattern { get; set; }
        public List<string>? Options { get; set; }
        public string? ExternalCollectionUrl { get; set; }
        
        public bool IsRequired { get; set; } = false;
    }
}