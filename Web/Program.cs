using Core.Interfaces;
using Core.Parsing;
using Core.Services;
using LaTeX.Services;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using Web;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

// Register Core services
builder.Services.AddSingleton<IRandomValueGenerator, UniformRandomGenerator>();
builder.Services.AddSingleton<IExpressionEvaluator, NCalcEvaluator>();
builder.Services.AddSingleton<ILaTeXRenderer, DummyRenderer>();
builder.Services.AddSingleton<ISpecificationLoader, PartOneTextLoader>();
// Repository will be populated when spec is loaded
builder.Services.AddSingleton<InMemoryTemplateRepository>(sp => new InMemoryTemplateRepository(new List<Core.Domain.QuestionTemplate>()));
builder.Services.AddSingleton<ITemplateRepository>(sp => sp.GetRequiredService<InMemoryTemplateRepository>());
builder.Services.AddSingleton<IDistractorGenerator, CommonMistakeDistractorGenerator>();
builder.Services.AddSingleton<ISolutionBuilder, PlainTextSolutionBuilder>();
builder.Services.AddSingleton<QuestionGenerator>();

var host = builder.Build();

// Load specification data on startup
var specLoader = host.Services.GetRequiredService<ISpecificationLoader>();
var templateRepo = host.Services.GetRequiredService<InMemoryTemplateRepository>();
var specFilePath = builder.Configuration["SpecFilePath"]
    ?? Path.Combine(AppContext.BaseDirectory, "Data", "part_one.txt");

try
{
    if (File.Exists(specFilePath))
    {
        var spec = await specLoader.LoadAsync(specFilePath);
        templateRepo.AddRange(spec.Templates);
    }
    else
    {
        Console.Error.WriteLine($"Warning: Specification file not found at '{specFilePath}'. Question generation will be unavailable until a valid spec file is provided.");
    }
}
catch (Exception ex)
{
    Console.Error.WriteLine($"Error loading specification file '{specFilePath}': {ex.Message}");
}

await host.RunAsync();
