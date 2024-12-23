// Services/BCryptPasswordHasher.cs
using BCrypt.Net;
using Microsoft.AspNetCore.Identity;

namespace DataGridSystem.Services
{
    public class BCryptPasswordHasher : IPasswordHasher<DataGridSystem.Models.User>
    {
        public string HashPassword(DataGridSystem.Models.User user, string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password);
        }

        public PasswordVerificationResult VerifyHashedPassword(DataGridSystem.Models.User user, string hashedPassword, string providedPassword)
        {
            var result = BCrypt.Net.BCrypt.Verify(providedPassword, hashedPassword);
            return result ? PasswordVerificationResult.Success : PasswordVerificationResult.Failed;
        }
    }
}
