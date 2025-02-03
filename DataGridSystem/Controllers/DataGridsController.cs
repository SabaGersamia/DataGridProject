using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DataGridSystem.Data;
using DataGridSystem.DTOs;
using DataGridSystem.Models;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Mapster;

namespace DataGridSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DataGridsController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly ApplicationDbContext _context;

        public DataGridsController(ApplicationDbContext context, UserManager<User> userManager)
        {
            _userManager = userManager;
            _context = context;
        }

        // GET: api/DataGrids
        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetDataGrids()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized("Invalid User ID.");

            var dataGrids = await _context.DataGrids
                    .Where(d => d.Owner.UserName == userIdClaim || d.IsPublic)
                    .Include(d => d.Rows)
                    .Include(d => d.Columns)
                    .ToListAsync();

            var dataGridDTOs = dataGrids.Adapt<List<DataGridDto>>();

            return Ok(dataGridDTOs);
        }

        // GET: api/DataGrids/5
        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetDataGrid(int id)
        {
            var dataGrid = await _context.DataGrids
                .Include(d => d.Rows)
                .Include(d => d.Columns)
                .SingleOrDefaultAsync(d => d.GridId == id);

            if (dataGrid == null)
                return NotFound();

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized("Invalid User ID.");


            if (dataGrid.IsPublic || dataGrid.Owner.UserName.ToString() == userIdClaim)
            {
                var dataGridDto = dataGrid.Adapt<DataGridDto>();

                return Ok(dataGridDto);
            }

            return Forbid();
        }

        // POST: api/DataGrids
        [HttpPost]
        [Authorize(Roles = "Administrator")]  // Only Admin can create grids
        public async Task<IActionResult> CreateDataGrid([FromBody] DataGridDto dataGridDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized("Invalid User ID.");

            var currentUser = await _userManager.FindByNameAsync(userIdClaim);
            if (currentUser == null)
                return Unauthorized("User not found.");

            // ✅ Create DataGrid Object
            var dataGrid = new DataGrid
            {
                Name = dataGridDto.Name,
                IsPublic = dataGridDto.IsPublic,
                Owner = currentUser,
                Columns = dataGridDto.Columns.Select(c => new Column
                {
                    Name = c.Name,
                    DataType = c.DataType
                }).ToList()
            };

            _context.DataGrids.Add(dataGrid);
            await _context.SaveChangesAsync(); // ✅ Save here so GridId is generated

            // ✅ Add Rows AFTER saving dataGrid to ensure it has a valid GridId
            var rows = dataGridDto.Rows.Select(rowDto => new Row
            {
                GridId = dataGrid.GridId, // ✅ Reference correct Grid ID
                Values = rowDto.Values
            }).ToList();

            _context.Rows.AddRange(rows); // ✅ Add all rows at once
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetDataGrid), new { id = dataGrid.GridId }, dataGridDto);
        }


        // PUT: api/DataGrids/5
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateDataGrid(int id, [FromBody] DataGridDto dataGridDto)
        {
            if (id != dataGridDto.GridId)
                return BadRequest("Grid ID mismatch.");

            var dataGrid = await _context.DataGrids.Include(g => g.Rows).FirstOrDefaultAsync(g => g.GridId == id);
            if (dataGrid == null)
                return NotFound();

            var userIdClaim = User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized("Invalid User ID.");

            if (dataGrid.Owner.UserName.ToString() != userIdClaim && !User.IsInRole("Administrator"))
                return Forbid();  // Only the owner or an admin can update

            dataGrid.Name = dataGridDto.Name;
            dataGrid.IsPublic = dataGridDto.IsPublic;

            // Updating rows if necessary
            foreach (var rowDto in dataGridDto.Rows)
            {
                var row = dataGrid.Rows.FirstOrDefault(r => r.RowId == rowDto.RowId);
                if (row != null)
                {
                    row.Values = rowDto.Values;
                }
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/DataGrids/5
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteDataGrid(int id)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
            {
                return Unauthorized("Invalid User ID.");
            }

            var dataGrid = await _context.DataGrids
                .Include(d => d.Owner) // Ensure owner is included
                .FirstOrDefaultAsync(d => d.GridId == id);

            if (dataGrid == null)
            {
                return NotFound();
            }

            Console.WriteLine($"DataGrid Owner: {dataGrid.Owner?.UserName}");

            if (dataGrid.Owner == null || (dataGrid.Owner.Id != userIdClaim && !User.IsInRole("Administrator")))
            {
                return Forbid(); // Only owner or admin can delete
            }

            _context.DataGrids.Remove(dataGrid);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
