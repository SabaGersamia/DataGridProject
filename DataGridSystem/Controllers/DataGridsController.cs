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
using Microsoft.Extensions.Logging;
using Microsoft.CodeAnalysis.Elfie.Diagnostics;

namespace DataGridSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DataGridsController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<DataGridsController> _logger;

        public DataGridsController(ApplicationDbContext context, UserManager<User> userManager, ILogger<DataGridsController> logger)
        {
            _userManager = userManager;
            _context = context;
            _logger = logger;
        }

        // GET: api/DataGrids
        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetDataGrids()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized("Invalid User ID.");

            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserName == userIdClaim);
            if (user == null)
                return Unauthorized("User not found.");

            var dataGrids = await _context.DataGrids
                .Where(d =>
                    d.Owner.UserName == userIdClaim ||
                    d.IsPublic ||
                    _context.DataGridPermissions.Any(p => p.GridId == d.GridId && p.UserId == user.Id))
                .Include(d => d.Rows)
                .Include(d => d.Columns)
                .ToListAsync();

            var dataGridDTOs = dataGrids.Adapt<List<DataGridDto>>();

            // Add AllowedUsers to each DTO
            foreach (var dto in dataGridDTOs)
            {
                dto.AllowedUsers = await _context.DataGridPermissions
                    .Where(p => p.GridId == dto.GridId)
                    .Select(p => p.User.UserName)
                    .ToListAsync();
            }

            return Ok(dataGridDTOs);
        }

        // GET: api/DataGrids/5
        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetDataGrid(int id)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized("Invalid User ID.");

            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserName == userIdClaim);
            if (user == null)
                return Unauthorized("User not found.");

            var dataGrid = await _context.DataGrids
                .Include(d => d.Rows)
                .Include(d => d.Columns)
                .FirstOrDefaultAsync(d => d.GridId == id);

            if (dataGrid == null)
                return NotFound();

            // Ensure user has access
            if (dataGrid.IsPublic || dataGrid.Owner.UserName == userIdClaim ||
                await _context.DataGridPermissions.AnyAsync(p => p.GridId == id && p.UserId == user.Id))
            {
                var dataGridDto = dataGrid.Adapt<DataGridDto>();

                dataGridDto.AllowedUsers = await _context.DataGridPermissions
                    .Where(p => p.GridId == id)
                    .Select(p => p.User.UserName)
                    .ToListAsync();

                return Ok(dataGridDto);
            }

            return Forbid();
        }

        // POST: api/DataGrids
        [HttpPost]
        [Authorize(Roles = "Administrator")]
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

            var dataGrid = dataGridDto.Adapt<DataGrid>();
            dataGrid.Owner = currentUser;
            _context.DataGrids.Add(dataGrid);
            await _context.SaveChangesAsync();

            if (!dataGrid.IsPublic && dataGridDto.AllowedUsers != null)
            {
                _logger.LogInformation("Assigning permissions to users: {Users}", string.Join(", ", dataGridDto.AllowedUsers));

                foreach (var username in dataGridDto.AllowedUsers)
                {
                    var user = await _context.Users.FirstOrDefaultAsync(u => u.UserName == username);
                    if (user != null)
                    {
                        _context.DataGridPermissions.Add(new DataGridPermission
                        {
                            GridId = dataGrid.GridId,
                            UserId = user.Id
                        });
                    }
                    else
                    {
                        _logger.LogWarning("User {Username} not found. Skipping.", username);
                    }
                }
                await _context.SaveChangesAsync();
            }
            else
            {
                _logger.LogWarning("No users provided for private DataGrid {GridId}.", dataGrid.GridId);
            }

            return CreatedAtAction(nameof(GetDataGrid), new { id = dataGrid.GridId }, dataGridDto);
        }

        // PUT: api/DataGrids/5
        [HttpPut("{id}")]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> UpdateDataGrid(int id, [FromBody] DataGridDto dataGridDto)
        {
            if (id != dataGridDto.GridId)
                return BadRequest("Grid ID mismatch.");

            if (dataGridDto == null)
                return BadRequest("Invalid data: dataGridDto is null.");

            var dataGrid = await _context.DataGrids
                .Include(g => g.Owner)
                .Include(g => g.Rows)
                .Include(g => g.Columns)
                .FirstOrDefaultAsync(g => g.GridId == id);

            if (dataGrid == null)
                return NotFound();

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized("Invalid User ID.");

            if (dataGrid.Owner == null)
                return BadRequest("Grid owner is missing.");

            if (dataGrid.Owner.UserName != userIdClaim && !User.IsInRole("Administrator"))
                return Forbid();

            // Update grid details
            dataGrid.Name = dataGridDto.Name ?? dataGrid.Name;
            dataGrid.IsPublic = dataGridDto.IsPublic;

            // Update existing rows
            if (dataGridDto.Rows != null)
            {
                foreach (var rowDto in dataGridDto.Rows)
                {
                    var row = dataGrid.Rows.FirstOrDefault(r => r.RowId == rowDto.RowId);
                    if (row != null)
                    {
                        row.Values = rowDto.Values;
                    }
                }
            }

            // Update existing columns
            if (dataGridDto.Columns != null)
            {
                foreach (var columnDto in dataGridDto.Columns)
                {
                    var column = dataGrid.Columns.FirstOrDefault(c => c.ColumnId == columnDto.ColumnId);
                    if (column != null)
                    {
                        column.Name = columnDto.Name;
                        column.DataType = columnDto.DataType;
                    }
                }
            }

            await _context.SaveChangesAsync();
            return Ok("Grid updated successfully");
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

            Console.WriteLine($"Logged-in User ID: {userIdClaim}");

            var dataGrid = await _context.DataGrids
                .Include(d => d.Owner)
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

        [HttpPost("{gridId}/rows/batch-delete")]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> DeleteMultipleRows(int gridId, [FromBody] List<int> rowIds)
        {
            if (rowIds == null || rowIds.Count == 0)
                return BadRequest("No rows selected for deletion.");

            var dataGrid = await _context.DataGrids
                .Include(g => g.Rows)
                .FirstOrDefaultAsync(g => g.GridId == gridId);

            if (dataGrid == null)
                return NotFound("Grid not found.");

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized("Invalid User ID.");

            if (dataGrid.Owner.UserName != userIdClaim && !User.IsInRole("Administrator"))
                return Forbid();

            // Delete selected rows
            var rowsToDelete = dataGrid.Rows.Where(r => rowIds.Contains(r.RowId)).ToList();
            _context.Rows.RemoveRange(rowsToDelete);

            await _context.SaveChangesAsync();
            return Ok($"{rowsToDelete.Count} rows deleted successfully.");
        }
    }
}
