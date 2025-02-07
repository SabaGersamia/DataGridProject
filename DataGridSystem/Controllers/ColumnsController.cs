using System.Collections.Generic;
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
    public class ColumnsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ColumnsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Columns/{gridId}
        [HttpGet("{gridId}")]
        public async Task<IActionResult> GetColumns(int gridId)
        {
            var columns = await _context.Columns
                .Where(c => c.GridId == gridId)
                .ToListAsync();

            if (!columns.Any())
            {
                return NotFound(new { message = "No columns found for this grid." });
            }

            return Ok(columns);
        }

        // GET: api/Columns/5
        [HttpGet("column/{id}")]
        public async Task<IActionResult> GetColumn(int id)
        {
            var column = await _context.Columns
                .FirstOrDefaultAsync(c => c.ColumnId == id);

            if (column == null)
            {
                return NotFound(new { message = "Column not found." });
            }

            return Ok(column);
        }

        // POST: api/Columns
        [HttpPost]
        public async Task<IActionResult> CreateColumn([FromBody] Column column)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Validate column type data
            if (!ValidateColumnType(column, out string validationError))
            {
                return BadRequest(new { message = validationError });
            }

            _context.Columns.Add(column);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetColumn), new { id = column.ColumnId }, column);
        }

        // PUT: api/Columns/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateColumn(int id, [FromBody] Column updatedColumn)
        {
            if (id != updatedColumn.ColumnId)
            {
                return BadRequest(new { message = "ID mismatch." });
            }

            var column = await _context.Columns.FindAsync(id);
            if (column == null)
            {
                return NotFound(new { message = "Column not found." });
            }

            if (!ValidateColumnType(updatedColumn, out string validationError))
            {
                return BadRequest(new { message = validationError });
            }

            column.Name = updatedColumn.Name;
            column.DataType = updatedColumn.DataType;
            column.ValidationPattern = updatedColumn.ValidationPattern;
            column.Options = updatedColumn.Options;
            column.ExternalCollectionUrl = updatedColumn.ExternalCollectionUrl;

            _context.Entry(column).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/Columns/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteColumn(int id)
        {
            var column = await _context.Columns.FindAsync(id);

            if (column == null)
            {
                return NotFound(new { message = "Column not found." });
            }

            _context.Columns.Remove(column);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // Helper function to validate column types
        private bool ValidateColumnType(Column column, out string errorMessage)
        {
            errorMessage = "";

            switch (column.DataType)
            {
                case "String":
                case "Numeric":
                case "Email":
                    return true;

                case "Regexp":
                    if (string.IsNullOrWhiteSpace(column.ValidationPattern))
                    {
                        errorMessage = "ValidationPattern is required for Regexp columns.";
                        return false;
                    }
                    return true;

                case "ExternalCollection":
                    if (string.IsNullOrWhiteSpace(column.ExternalCollectionUrl))
                    {
                        errorMessage = "ExternalCollectionUrl is required for External Collection columns.";
                        return false;
                    }
                    return true;

                case "SingleSelect":
                case "MultiSelect":
                    if (column.Options == null || !column.Options.Any())
                    {
                        errorMessage = "Options are required for Single-Select and Multi-Select columns.";
                        return false;
                    }
                    return true;

                default:
                    errorMessage = "Invalid DataType.";
                    return false;
            }
        }
    }
}
