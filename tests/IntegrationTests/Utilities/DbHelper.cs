using Data;
using System;
using System.Collections.Generic;

namespace IntegrationTests.Utilities
{
    internal static class DbHelper
    {
        public static void InitializeDbForTests(ApplicationContext db)
        {
            db.SaveChanges();
        }

    }
}
