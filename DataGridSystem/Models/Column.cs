using System.Collections.Generic;

namespace DataGridSystem.Models
{
    public class Column
    {
        public int ColumnId { get; set; }
        public string Name { get; set; }
        public string DataType { get; set; }// "String", "Numeric", "Email",
        public int GridId { get; set; }
        public DataGrid DataGrid { get; set; }
        public string? ValidationPattern { get; set; } // For Regexp validation
        public List<string>? Options { get; set; } // For Single-Select & Multi-Select options
        public string? ExternalCollectionUrl { get; set; } // For External Collection API URL
    }
}
