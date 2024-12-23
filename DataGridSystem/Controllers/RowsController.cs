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

        // Copy-Paste: Duplicate or move rows between grids
        [HttpPost("copy-paste")]
        public async Task<IActionResult> CopyPasteRows([FromBody] CopyPasteRequest request)
        {
            if (request.RowIds == null || request.RowIds.Length == 0)
                return BadRequest(new { message = "No rows specified." });

            var rowsToCopy = await _context.Rows
                .Where(r => request.RowIds.Contains(r.RowId))
                .ToListAsync();

            if (rowsToCopy.Count != request.RowIds.Length)
            {
                return NotFound(new { message = "One or more rows not found." });
            }

            if (request.TargetGridId != null)
            {
                foreach (var row in rowsToCopy)
                {
                    if (request.IsCopy)
                    {
                        var newRow = new Row
                        {
                            Values = row.Values,
                            GridId = request.TargetGridId.Value
                        };
                        _context.Rows.Add(newRow);
                    }
                    else
                    {
                        row.GridId = request.TargetGridId.Value;
                        _context.Rows.Update(row);
                    }
                }
            }
            else
            {
                // Copy within the same grid
                foreach (var row in rowsToCopy)
                {
                    if (request.IsCopy)
                    {
                        var newRow = new Row
                        {
                            Values = row.Values,
                            GridId = row.GridId
                        };
                        _context.Rows.Add(newRow);
                    }
                    else
                    {
                        // Move within the same grid, no changes required
                    }
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Rows copied/moved successfully." });
        }
    }

    public class CopyPasteRequest
    {
        public int[] RowIds { get; set; }
        public int? TargetGridId { get; set; }
        public bool IsCopy { get; set; }
    }
}
