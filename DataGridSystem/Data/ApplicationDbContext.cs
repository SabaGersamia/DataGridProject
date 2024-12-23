using DataGridSystem.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace DataGridSystem.Data
{
    public class ApplicationDbContext : IdentityDbContext<User>
    {
        public DbSet<DataGrid> DataGrids { get; set; }
        public DbSet<Column> Columns { get; set; }
        public DbSet<Row> Rows { get; set; }
        public DbSet<UserGridPermission> UserGridPermissions { get; set; }

        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.Entity<DataGrid>().ToTable("Grids");
            builder.Entity<Column>().ToTable("Columns");
            builder.Entity<Row>().ToTable("Rows");

            // Composite primary key for UserGridPermission
            builder.Entity<UserGridPermission>()
                .HasKey(ugp => new { ugp.GridId, ugp.UserId });
        }
    }
}
