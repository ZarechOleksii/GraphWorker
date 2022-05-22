using Microsoft.AspNetCore.Mvc;

namespace WebApp.Controllers
{
    public class GraphController : Controller
    {
        private readonly ILogger<GraphController> _logger;

        public GraphController(ILogger<GraphController> logger)
        {
            _logger = logger;
        }

        public IActionResult Index()
        {
            return View();
        }
    }
}
