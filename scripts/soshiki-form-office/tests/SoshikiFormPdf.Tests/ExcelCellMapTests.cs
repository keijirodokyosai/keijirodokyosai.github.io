using System.Text.Json.Nodes;
using Xunit;

namespace Soshiki.Form.Pdf.Tests;

public sealed class ExcelCellMapTests
{
    [Fact]
    public void Member_kanji_name_columns_are_K_and_Q()
    {
        var repoRoot = RepoLocator.Find(AppContext.BaseDirectory);
        var path = Path.Combine(repoRoot, "data", "soshiki-form-excel-cell-map.json");
        var cellMap = JsonNode.Parse(File.ReadAllText(path))!;

        var member = cellMap["member"]!;
        Assert.Equal("K", member["familyNameCol"]?.GetValue<string>());
        Assert.Equal("Q", member["givenNameCol"]?.GetValue<string>());
        Assert.NotEqual("L", member["familyNameCol"]?.GetValue<string>());
        Assert.NotEqual("R", member["givenNameCol"]?.GetValue<string>());
    }

    [Fact]
    public void Member_kana_name_columns_are_M_and_S()
    {
        var repoRoot = RepoLocator.Find(AppContext.BaseDirectory);
        var path = Path.Combine(repoRoot, "data", "soshiki-form-excel-cell-map.json");
        var cellMap = JsonNode.Parse(File.ReadAllText(path))!;

        var member = cellMap["member"]!;
        Assert.Equal("M", member["familyNameKanaCol"]?.GetValue<string>());
        Assert.Equal("S", member["givenNameKanaCol"]?.GetValue<string>());
    }
}
