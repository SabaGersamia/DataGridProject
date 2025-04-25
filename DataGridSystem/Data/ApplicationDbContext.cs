using DataGridSystem.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

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

            builder.Entity<Row>()
                .HasOne(r => r.DataGrid)
                .WithMany(g => g.Rows)
                .HasForeignKey(r => r.GridId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure JSON serialization for Values dictionary
            builder.Entity<Row>(entity => 
            {
                entity.Property(r => r.Values)
                    .HasColumnType("jsonb")
                    .HasConversion(
                        v => JsonConvert.SerializeObject(v, new JsonSerializerSettings
                        {
                            NullValueHandling = NullValueHandling.Ignore,
                            ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                            Formatting = Formatting.None
                        }),
                        v => JsonConvert.DeserializeObject<Dictionary<string, string>>(v) 
                            ?? new Dictionary<string, string>());

                entity.Property(r => r.CreatedAt)
                    .HasDefaultValueSql("NOW()") // PostgreSQL function
                    .ValueGeneratedOnAdd();
            });
        }

        public override int SaveChanges()
        {
            var entries = ChangeTracker.Entries()
                .Where(e => e.Entity is Row && e.State == EntityState.Added);

            foreach (var entityEntry in entries)
            {
                ((Row)entityEntry.Entity).CreatedAt = DateTime.UtcNow;
            }

            return base.SaveChanges();
        }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            var entries = ChangeTracker.Entries()
                .Where(e => e.Entity is Row && e.State == EntityState.Added);

            foreach (var entityEntry in entries)
            {
                ((Row)entityEntry.Entity).CreatedAt = DateTime.UtcNow;
            }

            return await base.SaveChangesAsync(cancellationToken);
        }
    }
}