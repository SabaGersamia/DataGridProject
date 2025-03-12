using DataGridSystem.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace DataGridSystem.Data
{
    public class ApplicationDbContext : IdentityDbContext<User, Role, string>
    {
        public DbSet<DataGrid> DataGrids { get; set; }
        public DbSet<Column> Columns { get; set; }
        public DbSet<Row> Rows { get; set; }
        public DbSet<DataGridPermission> DataGridPermissions { get; set; }

        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Table naming for PostgreSQL case-sensitivity
            builder.Entity<DataGrid>().ToTable("DataGrids");
            builder.Entity<Column>().ToTable("Columns");
            builder.Entity<Row>().ToTable("Rows");
            builder.Entity<DataGridPermission>().ToTable("DataGridPermissions");
            builder.Entity<Role>().ToTable("AspNetRoles");
            builder.Entity<User>().ToTable("AspNetUsers");

            // Relationships
            builder.Entity<DataGrid>()
                .HasMany(d => d.DataGridPermissions)
                .WithOne(p => p.DataGrid)
                .HasForeignKey(p => p.GridId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<User>()
                .HasMany(u => u.DataGridPermissions)
                .WithOne(p => p.User)
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<DataGridPermission>()
                .HasKey(p => new { p.GridId, p.UserId });
        }
    }
}
