using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DataGridSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SomeSecureController : ControllerBase
    {
        [HttpGet("secure-data")]
        [Authorize]
        public IActionResult GetSecureData()
        {
            return Ok(new { Message = "This is a secure message!" });
        }
    }
}
