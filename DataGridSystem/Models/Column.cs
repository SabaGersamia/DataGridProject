namespace DataGridSystem.Models
{
    public class Column
    {
        public int ColumnId { get; set; }
        public string Name { get; set; }
        public string DataType { get; set; }
        public int GridId { get; set; }
        public DataGrid DataGrid { get; set; }
    }
}
