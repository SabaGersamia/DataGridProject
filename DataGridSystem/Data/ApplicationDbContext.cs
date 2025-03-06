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

            builder.Entity<DataGrid>()
                .HasMany(d => d.DataGridPermissions)
                .WithOne(p => p.DataGrid)
                .HasForeignKey(p => p.GridId);

            builder.Entity<User>()
                .HasMany(u => u.DataGridPermissions)
                .WithOne(p => p.User)
                .HasForeignKey(p => p.UserId);

            builder.Entity<DataGridPermission>()
                .HasKey(p => new { p.GridId, p.UserId });
        }
    }
}
