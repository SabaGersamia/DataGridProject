using System.ComponentModel.DataAnnotations;

namespace DataGridSystem.Models
{
    public class DataGrid
    {
        [Key]
        public int GridId { get; set; }

        [Required(ErrorMessage = "The Name field is required.")]
        [StringLength(100, ErrorMessage = "The Name field cannot exceed 100 characters.")]
        public string Name { get; set; }

        [Required]
        public int OwnerId { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; }

        public bool IsPublic { get; set; }

        // Navigation properties
        public ICollection<UserGridPermission> UserPermissions { get; set; } = new List<UserGridPermission>();
        public ICollection<Column> Columns { get; set; } = new List<Column>();
        public ICollection<Row> Rows { get; set; } = new List<Row>();
    }

}
