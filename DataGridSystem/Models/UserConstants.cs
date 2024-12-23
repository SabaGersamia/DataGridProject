namespace DataGridSystem.Models
{
    public static class UserConstants
    {
        public static List<User> Users = new List<User>
        {
            new User
            {
                UserName = "admin",
                Email = "admin@email.com",
                PasswordHash = "Password1!",
            },
            new User
            {
                UserName = "user",
                Email = "user@email.com",
                PasswordHash = "Password1!",
            }
        };
    }
}
