using Data;
using Microsoft.EntityFrameworkCore;
using Models;
using System;
using System.Threading.Tasks;
using Xunit;

namespace UnitTests.DataTests
{
    public class BaseRepositoryTest
    {
        private readonly BaseRepository<WeatherForecast> _rep;
        private readonly ApplicationContext _context;

        public BaseRepositoryTest()
        {
            var dbName = $"SampleProject_{DateTime.Now.ToFileTimeUtc()}";
            DbContextOptions<ApplicationContext> dbContextOptions
                = new DbContextOptionsBuilder<ApplicationContext>()
                .UseInMemoryDatabase(dbName)
                .Options;
            _context = new ApplicationContext(dbContextOptions);
            PopulateData(_context);
            _rep = new BaseRepository<WeatherForecast>(_context);
        }

        [Fact]
        public async Task Add_WhenNotPresent_Success()
        {
            //arrange
            var testObject = new WeatherForecast() { };

            //act
            var before = (await _rep.FetchAllNoTracking()).Count;
            var result = await _rep.AddAsync(testObject);
            var after = (await _rep.FetchAllNoTracking()).Count;

            //assert
            Assert.True(result);
            Assert.Equal(4, before);
            Assert.Equal(5, after);
        }

        [Fact]
        public async Task Add_WhenPresent_Throws()
        {
            //arrange
            var testObject = new WeatherForecast()
            {
                Id = Guid.Parse("cefa6ffb-ce6e-4197-9c30-81459d072e5a")
            };

            //assert
            await Assert
                .ThrowsAsync<InvalidOperationException>(async ()
                => await _rep.AddAsync(testObject));
        }

        [Fact]
        public async Task Add_WhenTracked_Throws()
        {
            //arrange
            var testObject = await _rep.GetAsync(Guid.Parse("cefa6ffb-ce6e-4197-9c30-81459d072e5a"));

            //assert
            await Assert
                .ThrowsAsync<ArgumentException>(async ()
                => await _rep.AddAsync(testObject));
        }

        [Fact]
        public async Task Remove_WhenPresent_Success()
        {
            //arrange
            var testObject = await _rep.GetAsync(Guid.Parse("cefa6ffb-ce6e-4197-9c30-81459d072e5a"));

            //act
            var before = (await _rep.FetchAllNoTracking()).Count;
            var result = await _rep.DeleteAsync(testObject);
            var after = (await _rep.FetchAllNoTracking()).Count;

            //assert
            Assert.True(result);
            Assert.Equal(4, before);
            Assert.Equal(3, after);
        }

        [Fact]
        public async Task Remove_WhenNotPresent_Throws()
        {
            //arrange
            var testObject = new WeatherForecast() { Id = Guid.NewGuid() };

            //assert
            await Assert
                .ThrowsAsync<DbUpdateConcurrencyException>(async ()
                => await _rep.DeleteAsync(testObject));
        }

        [Fact]
        public async Task Remove_WhenNotTracked_Throws()
        {
            //arrange
            var testObject = new WeatherForecast() { Id = Guid.Parse("cefa6ffb-ce6e-4197-9c30-81459d072e5a") };

            //assert
            await Assert
                .ThrowsAsync<InvalidOperationException>(async ()
                => await _rep.DeleteAsync(testObject));
        }

        [Fact]
        public async Task Get_WhenPresent_Success()
        {
            //act
            var result = await _rep.GetAsync(Guid.Parse("cefa6ffb-ce6e-4197-9c30-81459d072e5a"));

            //assert
            Assert.Equal(0, result.TemperatureC);
        }

        [Fact]
        public async Task Get_WhenNotPresent_IsNull()
        {
            //act
            var result = await _rep.GetAsync(Guid.NewGuid());

            //assert
            Assert.Null(result);
        }

        [Fact]
        public async Task Update_WhenTracked_Success()
        {
            //arrange
            var toChange = await _rep.GetAsync(Guid.Parse("cefa6ffb-ce6e-4197-9c30-81459d072e5a"));

            //act
            toChange.TemperatureC = 50;
            await _rep.SaveChangesAsync();
            var changed = await _rep.GetAsync(Guid.Parse("cefa6ffb-ce6e-4197-9c30-81459d072e5a"));

            //assert
            Assert.Equal(50, changed.TemperatureC);
        }

        [Fact]
        public async Task Update_WhenUntracked_NotChanged()
        {
            //arrange
            var toChange = new WeatherForecast()
            {
                Id = Guid.Parse("cefa6ffb-ce6e-4197-9c30-81459d072e5a"),
                TemperatureC = 0
            };

            //act
            toChange.TemperatureC = 50;
            await _rep.SaveChangesAsync();
            var unchanged = await _rep.GetAsync(Guid.Parse("cefa6ffb-ce6e-4197-9c30-81459d072e5a"));

            //assert
            Assert.Equal(0, unchanged.TemperatureC);
        }
        private static void PopulateData(ApplicationContext context)
        {
            context.Forecasts.Add(new WeatherForecast
            {
                Id = Guid.Parse("cefa6ffb-ce6e-4197-9c30-81459d072e5a"),
                TemperatureC = 0
            });
            context.Forecasts.Add(new WeatherForecast
            {
                Id = Guid.Parse("adc71289-a52b-4d06-9ffe-ed8d36604f13"),
                TemperatureC = 1
            });
            context.Forecasts.Add(new WeatherForecast
            {
                Id = Guid.Parse("a81e2adf-d628-45a2-ba9d-e30e1a337432"),
                TemperatureC = 2
            });
            context.Forecasts.Add(new WeatherForecast
            {
                Id = Guid.Parse("1fda063f-c6a1-4022-b2e3-6e4d43db4d33"),
                TemperatureC = 3
            });
            context.SaveChanges();
        }
    }
}
