using Newtonsoft.Json;

namespace DataGridSystem.Models
{
    public class Row
    {
        public int RowId { get; set; }
        public int GridId { get; set; }
        public List<string> Values { get; set; }
        public DataGrid DataGrid { get; set; }
    }
}
