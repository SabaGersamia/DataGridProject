using Microsoft.AspNetCore.Identity;

namespace DataGridSystem.Models
{
    public class User : IdentityUser
    {
        public string? CustomProperty { get; set; }
    }
}
