using Microsoft.EntityFrameworkCore;

namespace Data
{
    public class ApplicationContext : DbContext
    {
        public ApplicationContext(DbContextOptions<ApplicationContext> options) : base(options)
        {
            Database.EnsureDeletedAsync().Wait();
            Database.EnsureCreatedAsync().Wait();
        }
    }
}