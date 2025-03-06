using DataGridSystem.Models;
using System.Threading.Tasks;

namespace DataGridSystem.Services
{
    public interface IUserService
    {
        Task<bool> CreateUserAsync(User user);
    }
}
