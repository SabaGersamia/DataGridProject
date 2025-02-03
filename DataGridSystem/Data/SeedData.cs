using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using DataGridSystem.Models;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace DataGridSystem.Data
{
    public static class SeedData
    {
        public static async Task Initialize(IServiceProvider serviceProvider, UserManager<User> userManager, RoleManager<Role> roleManager)
        {
            // Define role names to be used in the app
            var roleNames = new[] { "Administrator", "User" };

            // Check and create roles if they don't exist
            foreach (var roleName in roleNames)
            {
                var roleExist = await roleManager.RoleExistsAsync(roleName);
                if (!roleExist)
                {
                    await roleManager.CreateAsync(new Role { Name = roleName });
                }
            }

            // Create default admin user if it doesn't exist
            var user = await userManager.FindByEmailAsync("admin@example.com");
            if (user == null)
            {
                var adminUser = new User
                {
                    UserName = "admin@example.com",
                    Email = "admin@example.com",
                    CustomProperty = "Admin user default property"
                };

                var result = await userManager.CreateAsync(adminUser, "Admin@123");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(adminUser, "Administrator");
                }
            }

            // Create default regular user if it doesn't exist
            var regularUser = await userManager.FindByEmailAsync("user@example.com");
            if (regularUser == null)
            {
                var userUser = new User
                {
                    UserName = "user@example.com",
                    Email = "user@example.com",
                    CustomProperty = "Regular user default property"
                };

                var result = await userManager.CreateAsync(userUser, "User@123");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(userUser, "User");
                }
            }
        }
    }
}
