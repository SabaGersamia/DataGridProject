using Microsoft.AspNetCore.Identity;

namespace DataGridSystem.Models
{
    public class User : IdentityUser
    {
        public string? CustomProperty { get; set; }
        public List<DataGridPermission> DataGridPermissions { get; set; } = new();
    }
}
