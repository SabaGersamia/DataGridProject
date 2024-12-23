using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DataGridSystem.Data;
using DataGridSystem.Models;
using System.Linq;
using System.Threading.Tasks;

namespace DataGridSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DataGridsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DataGridsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/DataGrids
        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetDataGrids()
        {
            var userIdClaim = User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized("Invalid User ID.");

            // Compare as string instead of integer
            var dataGrids = await _context.DataGrids
                .Where(g => g.OwnerId.ToString() == userIdClaim || g.IsPublic)
                .ToListAsync();

            return Ok(dataGrids);
        }

        // GET: api/DataGrids/5
        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetDataGrid(int id)
        {
            var dataGrid = await _context.DataGrids
                .Include(g => g.UserPermissions)
                .FirstOrDefaultAsync(g => g.GridId == id);

            if (dataGrid == null)
                return NotFound();

            var userIdClaim = User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized("Invalid User ID.");

            if (dataGrid.IsPublic || dataGrid.OwnerId.ToString() == userIdClaim || dataGrid.UserPermissions.Any(p => p.UserId == userIdClaim))
            {
                return Ok(dataGrid);
            }

            return Forbid();
        }

        // POST: api/DataGrids
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateDataGrid([FromBody] DataGrid dataGrid)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userIdClaim = User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized("Invalid User ID.");

            if (!int.TryParse(userIdClaim, out int ownerId))
            {
                return BadRequest("Invalid User ID format.");
            }

            dataGrid.OwnerId = ownerId;
            dataGrid.CreatedAt = DateTime.UtcNow;
            dataGrid.IsPublic = false;

            _context.DataGrids.Add(dataGrid);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetDataGrid), new { id = dataGrid.GridId }, dataGrid);
        }


        // PUT: api/DataGrids/5
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateDataGrid(int id, [FromBody] DataGrid updatedDataGrid)
        {
            if (id != updatedDataGrid.GridId)
                return BadRequest("Grid ID mismatch.");

            var dataGrid = await _context.DataGrids.FindAsync(id);
            if (dataGrid == null)
                return NotFound();

            var userIdClaim = User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized("Invalid User ID.");

            if (dataGrid.OwnerId.ToString() != userIdClaim)
                return Forbid();

            dataGrid.Name = updatedDataGrid.Name;
            dataGrid.IsPublic = updatedDataGrid.IsPublic;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/DataGrids/5
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteDataGrid(int id)
        {
            var dataGrid = await _context.DataGrids.FindAsync(id);
            if (dataGrid == null)
                return NotFound();

            var userIdClaim = User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized("Invalid User ID.");

            if (dataGrid.OwnerId.ToString() != userIdClaim)
                return Forbid();

            _context.DataGrids.Remove(dataGrid);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/DataGrids/{id}/permissions
        [HttpPost("{id}/permissions")]
        [Authorize]
        public async Task<IActionResult> AssignPermission(int id, [FromBody] string userId)
        {
            var dataGrid = await _context.DataGrids.FindAsync(id);
            if (dataGrid == null)
                return NotFound();

            if (dataGrid.IsPublic)
                return BadRequest("Cannot assign permissions to a public grid.");

            var existingPermission = await _context.UserGridPermissions
                .FirstOrDefaultAsync(p => p.GridId == id && p.UserId == userId);

            if (existingPermission != null)
                return BadRequest("Permission already exists.");

            var permission = new UserGridPermission
            {
                GridId = id,
                UserId = userId
            };
            _context.UserGridPermissions.Add(permission);
            await _context.SaveChangesAsync();

            return Ok(permission);
        }

        // DELETE: api/DataGrids/{id}/permissions/{userId}
        [HttpDelete("{id}/permissions/{userId}")]
        [Authorize]
        public async Task<IActionResult> RevokePermission(int id, string userId)
        {
            var dataGrid = await _context.DataGrids.FindAsync(id);
            if (dataGrid == null)
                return NotFound();

            if (dataGrid.IsPublic)
                return BadRequest("Cannot revoke permissions from a public grid.");

            var permission = await _context.UserGridPermissions
                .FirstOrDefaultAsync(p => p.GridId == id && p.UserId == userId);
            if (permission == null)
                return NotFound("Permission not found.");

            _context.UserGridPermissions.Remove(permission);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
