using System.Text.RegularExpressions;

namespace DataGridSystem.Models
{
    public class RegisterModel
    {
        public string UserName { get; set; }
        public string Email { get; set; }

        private string _password;
        public string Password
        {
            get => _password;
            set
            {
                // Validate password strength
                if (!ValidatePassword(value))
                    throw new ArgumentException("Password must contain at least 8 chars, one uppercase, one number, one special character");
                _password = value;
            }
        }

        private bool ValidatePassword(string password)
        {
            // Password must contain at least 8 chars, one uppercase, one number, and one special character
            var passwordRegex = new Regex(@"^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$");
            return passwordRegex.IsMatch(password);
        }
    }
}
