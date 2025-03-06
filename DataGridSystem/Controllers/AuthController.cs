using DataGridSystem.Models;
using DataGridSystem.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace DataGridSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly JwtTokenService _jwtTokenService;
        private readonly UserManager<User> _userManager;
        private readonly IPasswordHasher<User> _passwordHasher;

        public AuthController(JwtTokenService jwtTokenService, UserManager<User> userManager, IPasswordHasher<User> passwordHasher)
        {
            _jwtTokenService = jwtTokenService;
            _userManager = userManager;
            _passwordHasher = passwordHasher;
        }

        // POST: api/auth/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginModel login)
        {
            // Find the user by username
            var user = await _userManager.FindByNameAsync(login.UserName);
            if (user == null)
            {
                return Unauthorized("Invalid username or password.");
            }

            // Verify the password using PasswordHasher
            var passwordVerificationResult = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, login.Password);
            if (passwordVerificationResult != PasswordVerificationResult.Success)
            {
                return Unauthorized("Invalid username or password.");
            }

            // Retrieve the roles associated with the user
            var roles = await _userManager.GetRolesAsync(user);

            // Generate a JWT token
            var token = _jwtTokenService.GenerateToken(user.UserName, roles);

            return Ok(new { Token = token });
        }

        // POST: api/auth/register
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterModel registerModel)
        {
            var existingUser = await _userManager.FindByNameAsync(registerModel.UserName);
            if (existingUser != null)
            {
                return BadRequest("User already exists.");
            }

            var user = new User
            {
                UserName = registerModel.UserName,
                Email = registerModel.Email
            };

            var result = await _userManager.CreateAsync(user, registerModel.Password);
            if (!result.Succeeded)
            {
                return BadRequest("Error creating user.");
            }

            await _userManager.AddToRoleAsync(user, "User");

            return Ok("User registered successfully.");
        }

        [Authorize(Roles = "Administrator")]
        [HttpGet("Admins")]
        public IActionResult AdminsEndpoint()
        {
            var currentUser = GetCurrentUser();
            return Ok($"Hi {currentUser.UserName}, you are an Administrator.");
        }

        [Authorize(Roles = "User")]
        [HttpGet("Users")]
        public IActionResult UsersEndpoint()
        {
            var currentUser = GetCurrentUser();
            return Ok($"Hi {currentUser.UserName}, you are a User.");
        }

        [Authorize(Roles = "Administrator,User")]
        [HttpGet("AdminsAndUsers")]
        public IActionResult AdminsAndUsersEndpoint()
        {
            var currentUser = GetCurrentUser();
            return Ok($"Hi {currentUser.UserName}, you are authorized.");
        }

        // Public endpoint that does not require authentication
        [AllowAnonymous]
        [HttpGet("Public")]
        public IActionResult PublicEndpoint()
        {
            return Ok("Hi, you're on public property.");
        }

        private User GetCurrentUser()
        {
            var identity = User.Identity as ClaimsIdentity;

            if (identity != null)
            {
                var userClaims = identity.Claims;

                return new User
                {
                    UserName = userClaims.FirstOrDefault(o => o.Type == ClaimTypes.NameIdentifier)?.Value ?? string.Empty,
                    Email = userClaims.FirstOrDefault(o => o.Type == ClaimTypes.Email)?.Value ?? string.Empty
                };
            }
            return null;
        }
    }
}
