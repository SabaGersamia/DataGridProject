using Microsoft.AspNetCore.Mvc;

namespace DataGridSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HomeController : ControllerBase
    {
        [HttpGet]
        public IActionResult Index()
        {
            return Ok(new { message = "Welcome to the DataGrid System API!" });
        }
    }
}
