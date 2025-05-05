using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DataGridSystem.Data;
using DataGridSystem.Models;
using System.Text.RegularExpressions;

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

        private bool ValidateColumnType(Column column, out string validationError)
        {
            validationError = string.Empty;
            
            if (string.IsNullOrWhiteSpace(column.Name))
            {
                validationError = "Column name cannot be empty";
                return false;
            }

            if (column.Name.Length > 100)
            {
                validationError = "Column name cannot exceed 100 characters";
                return false;
            }

            var validDataTypes = new List<string> { 
                "String", "Number", "Boolean", "Date", 
                "Email", "URL", "SingleSelect", "MultiSelect", 
                "Reference", "ExternalCollection" 
            };

            if (!validDataTypes.Contains(column.DataType))
            {
                validationError = $"Invalid data type: {column.DataType}";
                return false;
            }

            if (!string.IsNullOrEmpty(column.ValidationPattern))
            {
                try
                {
                    _ = new Regex(column.ValidationPattern);
                }
                catch (ArgumentException ex)
                {
                    validationError = $"Invalid validation pattern: {ex.Message}";
                    return false;
                }
            }

            if ((column.DataType == "SingleSelect" || column.DataType == "MultiSelect") && 
                (column.Options == null || !column.Options.Any()))
            {
                validationError = "Select types must have options defined";
                return false;
            }

            if (column.DataType == "ExternalCollection" && 
                string.IsNullOrEmpty(column.ExternalCollectionUrl))
            {
                validationError = "ExternalCollection type must have a collection URL";
                return false;
            }

            return true;
        }
    }
}
