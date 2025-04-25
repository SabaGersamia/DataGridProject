using System.ComponentModel.DataAnnotations.Schema;
using Newtonsoft.Json;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DataGridSystem.Models
{
    public class Row
    {
        public int RowId { get; set; }
        public int GridId { get; set; }
        
        [Column(TypeName = "jsonb")]
        public Dictionary<string, string> Values { get; set; } = new();
        
        public string Status { get; set; } = "ToDo";

        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        [JsonIgnore]
        public DataGrid DataGrid { get; set; }
    }
}