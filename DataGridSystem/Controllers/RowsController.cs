using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DataGridSystem.Data;
using DataGridSystem.DTOs;
using DataGridSystem.Models;
using System.Security.Claims;
using FluentValidation;
using System.Text.RegularExpressions;

namespace DataGridSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class RowsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public RowsController(ApplicationDbContext context)
        {
            _context = context;
        }

        private async Task<bool> UserHasAccessToGrid(int gridId, string userId)
        {
            var grid = await _context.DataGrids
                .Include(g => g.Owner)
                .FirstOrDefaultAsync(g => g.GridId == gridId);

            if (grid == null) return false;

            var isAdmin = User.IsInRole("Administrator"); // Check admin role

            return grid.IsPublic ||
                isAdmin ||
                grid.Owner.Id == userId ||
                await _context.DataGridPermissions.AnyAsync(p => p.GridId == gridId && p.UserId == userId);
        }

        // POST: api/Rows/{gridId}
        [HttpPost("{gridId}/rows")]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> CreateRow(int gridId, [FromBody] CreateRowDto rowDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized("Invalid User ID.");

            if (!await UserHasAccessToGrid(gridId, userId))
                return Forbid();

            try 
            {
                var gridColumns = await _context.Columns
                    .Where(c => c.GridId == gridId)
                    .ToListAsync();

                foreach (var columnEntry in rowDto.Values)
                {
                    var columnDefinition = gridColumns.FirstOrDefault(c => c.Name == columnEntry.Key);
                    if (columnDefinition == null)
                        return BadRequest($"Column '{columnEntry.Key}' doesn't exist in grid {gridId}");

                    if (!ValidateColumnDataType(columnEntry.Value, columnDefinition.DataType, columnDefinition, out string errorMessage))
                        return BadRequest($"Invalid data for column '{columnEntry.Key}': {errorMessage}");
                }

                var newRow = new Row
                {
                    GridId = gridId,
                    Values = rowDto.Values,
                    Status = rowDto.Status,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Rows.Add(newRow);
                await _context.SaveChangesAsync();

                // Fixed return statement with proper comma
                return CreatedAtAction(nameof(GetRows), new { gridId = gridId }, new {
                    RowId = newRow.RowId,
                    GridId = newRow.GridId,
                    Values = newRow.Values,
                    Status = newRow.Status,
                    CreatedAt = newRow.CreatedAt
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error creating row in grid {gridId}: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/Rows/{gridId}
        [HttpGet("{gridId}")]
        public async Task<IActionResult> GetRows(int gridId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!await UserHasAccessToGrid(gridId, userId))
                return Forbid();

            var rows = await _context.Rows
                .Where(r => r.GridId == gridId)
                .ToListAsync();

            var rowDtos = rows.Select(r => new RowDto
            {
                RowId = r.RowId,
                GridId = r.GridId,
                Values = r.Values,
                Status = r.Status,
                CreatedAt = r.CreatedAt
            }).ToList();

            return Ok(rowDtos);
        }
        private bool ValidateColumnDataType(object value, string dataType, Column column, out string errorMessage)
        {
            errorMessage = null;
            switch (dataType)
            {
                case "String":
                    if (value is not string)
                    {
                        errorMessage = "Value must be a string.";
                        return false;
                    }
                    break;
                
                case "Numeric":
                    if (!decimal.TryParse(value?.ToString(), out _))
                    {
                        errorMessage = "Value must be a valid number.";
                        return false;
                    }
                    break;

                case "Email":
                    if (value is not string || !Regex.IsMatch(value.ToString(), @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
                    {
                        errorMessage = "Value must be a valid email address.";
                        return false;
                    }
                    break;

                case "Regexp":
                    if (value is not string || !Regex.IsMatch(value.ToString(), column.ValidationPattern))
                    {
                        errorMessage = $"Value must match the regular expression {column.ValidationPattern}.";
                        return false;
                    }
                    break;

                case "ExternalCollection":
                    // Add your custom validation logic for ExternalCollection columns
                    break;

                case "SingleSelect":
                case "MultiSelect":
                    if (value is not string || !column.Options.Contains(value.ToString()))
                    {
                        errorMessage = "Value must be one of the allowed options.";
                        return false;
                    }
                    break;

                default:
                    errorMessage = "Unknown column type.";
                    return false;
            }
            return true;
        }

        // PUT: api/Rows/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRow(int id, [FromBody] RowDto updatedRowDto)
        {
            if (id != updatedRowDto.RowId)
                return BadRequest("ID mismatch.");

            var row = await _context.Rows
                .FirstOrDefaultAsync(r => r.RowId == id); // Removed unnecessary includes

            if (row == null) return NotFound();

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!await UserHasAccessToGrid(row.GridId, userId))
                return Forbid();

            // Only update what's necessary
            row.Values = updatedRowDto.Values ?? row.Values; // Keep existing if null
            row.Status = updatedRowDto.Status ?? row.Status;

            try
            {
                await _context.SaveChangesAsync();
                return Ok(new RowDto { // Return the updated row
                    RowId = row.RowId,
                    GridId = row.GridId,
                    Values = row.Values,
                    Status = row.Status,
                    CreatedAt = row.CreatedAt
                });
            }
            catch (DbUpdateConcurrencyException)
            {
                return Conflict("The row was modified by another user. Please refresh.");
            }
        }

        // DELETE: api/Rows/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRow(int id)
        {
            var row = await _context.Rows
                .Include(r => r.DataGrid)
                .ThenInclude(g => g.Owner)
                .FirstOrDefaultAsync(r => r.RowId == id);

            if (row == null) return NotFound();

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!await UserHasAccessToGrid(row.GridId, userId))
                return Forbid();

            _context.Rows.Remove(row);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/Rows/batch
        [HttpDelete("batch")]
        public async Task<IActionResult> DeleteRows([FromBody] int[] rowIds)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var rowsToDelete = await _context.Rows
                .Include(r => r.DataGrid)
                .ThenInclude(g => g.Owner)
                .Where(r => rowIds.Contains(r.RowId))
                .ToListAsync();

            if (!rowsToDelete.All(r => r.DataGrid != null))
                return NotFound("One or more rows not found.");

            foreach (var row in rowsToDelete)
            {
                if (!await UserHasAccessToGrid(row.GridId, userId))
                    return Forbid();
            }

            _context.Rows.RemoveRange(rowsToDelete);
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

        // Batch Operations
        [HttpPost("{gridId}/batch")]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> CreateBatchRows(int gridId, [FromBody] List<CreateRowDto> rowDtos)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!await UserHasAccessToGrid(gridId, userId))
                return Forbid();

            // Validate import data
            var validationResult = await ValidateImportData(gridId, rowDtos);
            if (validationResult != null) return validationResult;

            try 
            {
                var newRows = new List<Row>();
                foreach (var rowDto in rowDtos)
                {
                    var newRow = new Row
                    {
                        GridId = gridId,
                        Values = rowDto.Values,
                        Status = rowDto.Status ?? "ToDo",
                        CreatedAt = DateTime.UtcNow
                    };
                    newRows.Add(newRow);
                }

                await _context.Rows.AddRangeAsync(newRows);
                await _context.SaveChangesAsync();

                return Ok(new {
                    message = $"{newRows.Count} rows imported successfully",
                    importedRows = newRows.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error importing rows: {ex.Message}");
            }
        }

private async Task<IActionResult> ValidateImportData(int gridId, List<CreateRowDto> rows)
{
    if (rows == null || !rows.Any())
        return BadRequest("No rows provided for import");

    var columns = await _context.Columns
        .Where(c => c.GridId == gridId)
        .ToListAsync();

    if (!columns.Any())
        return BadRequest("Grid has no columns defined");

    var requiredColumns = columns
        .Where(c => c.IsRequired)
        .Select(c => c.Name)
        .ToList();

    var allColumnNames = columns.Select(c => c.Name).ToList();

    for (int i = 0; i < rows.Count; i++)
    {
        var row = rows[i];
        var rowNumber = i + 1;

        // Check for required columns
        foreach (var requiredCol in requiredColumns)
        {
            if (!row.Values.ContainsKey(requiredCol))
            {
                return BadRequest($"Row {rowNumber}: Missing required column '{requiredCol}'");
            }

            if (string.IsNullOrWhiteSpace(row.Values[requiredCol]))
            {
                return BadRequest($"Row {rowNumber}: Required column '{requiredCol}' cannot be empty");
            }
        }

        // Validate all provided columns exist
        foreach (var columnName in row.Values.Keys)
        {
            if (!allColumnNames.Contains(columnName))
            {
                return BadRequest($"Row {rowNumber}: Column '{columnName}' does not exist in grid");
            }
        }

        // Validate data types
        foreach (var kvp in row.Values)
        {
            var column = columns.First(c => c.Name == kvp.Key);
            if (!ValidateColumnDataType(kvp.Value, column.DataType, column, out string errorMessage))
            {
                return BadRequest($"Row {rowNumber}: {errorMessage}");
            }
        }
    }

    return null;
}

        [HttpDelete("{gridId}/batch")]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> DeleteBatchRows(int gridId, [FromBody] List<int> rowIds)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!await UserHasAccessToGrid(gridId, userId))
                return Forbid();

            var rowsToDelete = await _context.Rows
                .Where(r => r.GridId == gridId && rowIds.Contains(r.RowId))
                .ToListAsync();

            if (rowsToDelete.Count != rowIds.Count)
                return NotFound("Some rows not found");

            _context.Rows.RemoveRange(rowsToDelete);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}