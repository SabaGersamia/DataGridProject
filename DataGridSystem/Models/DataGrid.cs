using DataGridSystem.Models;
using System.ComponentModel.DataAnnotations;

public class DataGrid
{
    [Key]
    public int GridId { get; set; }

    public string Name { get; set; }
    public bool IsPublic { get; set; }
    public User Owner { get; set; }
    public DateTime CreatedAt { get; set; }

    public List<Column> Columns { get; set; }
    public List<Row> Rows { get; set; }

    public List<DataGridPermission> DataGridPermissions { get; set; } = new();
}
