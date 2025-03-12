using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.Filters;
using DataGridSystem.Data;
using DataGridSystem.Models;
using DataGridSystem.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Configuration;

var builder = WebApplication.CreateBuilder(args);

var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
builder.WebHost.UseUrls($"http://*:{port}");

builder.Services.AddControllers();

// Allow frontend to access backend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Swagger configuration with JWT authorization
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add Identity configuration
builder.Services.AddIdentity<User, Role>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
    };
});

builder.Services.AddScoped<JwtTokenService>();

var app = builder.Build();

app.UseCors("AllowFrontend");

// Enable Swagger UI
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

await SeedData(app);

app.Run();

static async Task SeedData(IApplicationBuilder app)
{
    using (var scope = app.ApplicationServices.CreateScope())
    {
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<Role>>();

        // Define roles to seed
        var roles = new[] { "Administrator", "User" };

        // Create roles if they do not exist
        foreach (var roleName in roles)
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                await roleManager.CreateAsync(new Role { Name = roleName });
                Console.WriteLine($"Role '{roleName}' created successfully!");
            }
            else
            {
                Console.WriteLine($"Role '{roleName}' already exists!");
            }
        }

        // Seed Admin user if not already created
        var adminUser = await userManager.FindByNameAsync("admin");
        if (adminUser == null)
        {
            var admin = new User
            {
                UserName = "admin",
                Email = "admin@email.com",
                CustomProperty = "default_value"
            };

            var result = await userManager.CreateAsync(admin, "Password1!");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(admin, "Administrator");
                Console.WriteLine("Admin user created successfully!");
            }
            else
            {
                Console.WriteLine("Failed to create Admin user:");
                foreach (var error in result.Errors)
                {
                    Console.WriteLine($" - {error.Description}");
                }
            }
        }
        else
        {
            Console.WriteLine("Admin user already exists!");
        }

        // Seed regular User if not already created
        var regularUser = await userManager.FindByNameAsync("user");
        if (regularUser == null)
        {
            var user = new User
            {
                UserName = "user",
                Email = "user@email.com",
                CustomProperty = "default_value"
            };

            var result = await userManager.CreateAsync(user, "Password1!");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(user, "User");
                Console.WriteLine("Regular user created successfully!");
            }
            else
            {
                Console.WriteLine("Failed to create regular user:");
                foreach (var error in result.Errors)
                {
                    Console.WriteLine($" - {error.Description}");
                }
            }
        }
        else
        {
            Console.WriteLine("Regular user already exists!");
        }
    }
}