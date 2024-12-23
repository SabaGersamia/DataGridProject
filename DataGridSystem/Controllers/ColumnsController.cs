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
        [HttpGet("{id}")]
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

            column.Name = updatedColumn.Name;
            column.DataType = updatedColumn.DataType;
            column.GridId = updatedColumn.GridId;

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
    }
}
