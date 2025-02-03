using DataGridSystem.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System.Data;
using System.Reflection.Emit;

namespace DataGridSystem.Data
{
    public class ApplicationDbContext : IdentityDbContext<User, Role, string>
    {
        public DbSet<DataGrid> DataGrids { get; set; }
        public DbSet<Column> Columns { get; set; }
        public DbSet<Row> Rows { get; set; }

        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

           
            // Table name mapping
            builder.Entity<DataGrid>().ToTable("Grids");

            builder.Entity<Column>()
                      .HasOne(c => c.DataGrid)
                      .WithMany(d => d.Columns)
                      .HasForeignKey(c => c.GridId);

            builder.Entity<Row>()
                .HasOne(r => r.DataGrid)
                .WithMany(d => d.Rows)
                .HasForeignKey(r => r.GridId);

            // Composite primary key for UserGridPermission (if you're still using it)
            builder.Entity<UserGridPermission>()
                .HasKey(ugp => new { ugp.GridId, ugp.UserId });

        }
    }
}
