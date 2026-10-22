using System.Text.Json.Nodes;
using Xunit;

namespace Soshiki.Form.Pdf.Tests;

public sealed class KuchiCalculatorTests
{
    [Fact]
    public void Compute_060000001_matches_web_kakekin()
    {
        var repoRoot = RepoLocator.Find(AppContext.BaseDirectory);
        var unionMaster = JsonNode.Parse(File.ReadAllText(Path.Combine(repoRoot, "data", "union-master.json")))!;
        var kyosaiMap = JsonNode.Parse(File.ReadAllText(Path.Combine(repoRoot, "data", "form-kyosai-map.json")))!;

        JsonNode? union = null;
        foreach (var u in unionMaster["unions"]!.AsArray())
        {
            if (u?["KyosaikaiCode"]?.GetValue<string>() == "060000001")
            {
                union = u;
                break;
            }
        }

        Assert.NotNull(union);
        var result = KuchiCalculator.Compute(union, kyosaiMap);

        Assert.Equal(300, result.KakekinPerPerson);
        Assert.Equal("1", result.FormKuchi["sogo-kyosai"]);
        Assert.True(result.FormKuchi.TryGetValue("keicho", out var keicho) && !string.IsNullOrEmpty(keicho));
    }
}
