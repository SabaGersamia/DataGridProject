using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DataGridSystem.Data;
using DataGridSystem.Models;

namespace DataGridSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RowsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public RowsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Rows/{gridId}
        [HttpGet("{gridId}")]
        public async Task<IActionResult> GetRows(int gridId)
        {
            var rows = await _context.Rows
                .Where(r => r.GridId == gridId)
                .Include(r => r.DataGrid)
                .ToListAsync();

            if (!rows.Any())
            {
                return NotFound(new { message = "No rows found for the specified grid." });
            }

            return Ok(rows);
        }

        // POST: api/Rows
        [HttpPost]
        public async Task<IActionResult> CreateRow([FromBody] Row row)
        {
            if (row == null)
                return BadRequest("Invalid row data.");

            // Ensure the GridId exists before creating the row
            var gridExists = await _context.DataGrids.AnyAsync(g => g.GridId == row.GridId);
            if (!gridExists)
            {
                return BadRequest("Grid does not exist.");
            }

            _context.Rows.Add(row);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetRows), new { gridId = row.GridId }, row);
        }

        // PUT: api/Rows/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRow(int id, [FromBody] Row updatedRow)
        {
            if (id != updatedRow.RowId)
                return BadRequest(new { message = "ID mismatch." });

            var row = await _context.Rows.FindAsync(id);
            if (row == null)
                return NotFound();

            row.Values = updatedRow.Values;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Rows.Any(e => e.RowId == id))
                {
                    return NotFound(new { message = "Row not found." });
                }

                throw;
            }

            return NoContent();
        }

        // DELETE: api/Rows/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRow(int id)
        {
            var row = await _context.Rows.FindAsync(id);

            if (row == null)
                return NotFound(new { message = "Row not found." });

            _context.Rows.Remove(row);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // Multi-delete: Delete multiple rows
        [HttpDelete("batch")]
        public async Task<IActionResult> DeleteRows([FromBody] int[] rowIds)
        {
            var rowsToDelete = await _context.Rows
                .Where(r => rowIds.Contains(r.RowId))
                .ToListAsync();

            if (rowsToDelete.Count != rowIds.Length)
            {
                return NotFound(new { message = "One or more rows not found." });
            }

            _context.Rows.RemoveRange(rowsToDelete);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
