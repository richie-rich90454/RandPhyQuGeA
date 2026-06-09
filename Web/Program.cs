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

await builder.Build().RunAsync();
