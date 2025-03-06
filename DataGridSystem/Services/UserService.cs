using DataGridSystem.Models;
using Microsoft.AspNetCore.Identity;
using System.Threading.Tasks;

namespace DataGridSystem.Services
{
    public class UserService : IUserService
    {
        private readonly UserManager<User> _userManager;

        public UserService(UserManager<User> userManager)
        {
            _userManager = userManager;
        }

        public async Task<bool> CreateUserAsync(User user)
        {
            var result = await _userManager.CreateAsync(user, "DefaultPassword123!");
            return result.Succeeded;
        }
    }
}
