namespace DataGridSystem.Models
{
    public class UserGridPermission
    {
        public int GridId { get; set; }
        public DataGrid Grid { get; set; }

        public string UserId { get; set; }
        public User User { get; set; }
    }
}
