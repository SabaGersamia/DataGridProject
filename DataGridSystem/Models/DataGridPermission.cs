using DataGridSystem.Models;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

public class DataGridPermission
{
    [Key]
    public int Id { get; set; }

    [Required]
    public string UserId { get; set; }

    [ForeignKey("UserId")]
    public User User { get; set; }

    [Required]
    public int GridId { get; set; }

    [ForeignKey("GridId")]
    public DataGrid DataGrid { get; set; }

    public string PermissionType { get; set; }
}
