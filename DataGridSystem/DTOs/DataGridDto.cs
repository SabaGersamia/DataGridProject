using System.Collections.Generic;

namespace DataGridSystem.DTOs
{
    public class DataGridDto
    {
        public int GridId { get; set; }
        public string Name { get; set; }
        public bool IsPublic { get; set; }

        public List<ColumnDto> Columns { get; set; } = new List<ColumnDto>();

        public List<RowDto> Rows { get; set; } = new List<RowDto>();

        public List<string?> AllowedUsers { get; set; } = new List<string>();
    }

    public class ColumnDto
    {
        public int ColumnId { get; set; }
        public string Name { get; set; }
        public string DataType { get; set; }
    }
    public class RowDto
    {
        public int RowId { get; set; }
        public List<string> Values { get; set; }
    }
}
