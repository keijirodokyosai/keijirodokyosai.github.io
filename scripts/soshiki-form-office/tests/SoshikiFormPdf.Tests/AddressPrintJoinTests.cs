using System.Text.Json.Nodes;
using Xunit;

namespace Soshiki.Form.Pdf.Tests;

public sealed class AddressPrintJoinTests
{
    [Fact]
    public void Join_short_town_merges_area_into_display_parts()
    {
        var (town, area) = AddressPrintJoin.ComputeTownAreaPrintJoin("abc", "1-2-3", 12);
        Assert.Equal("abc1-2-3", town);
        Assert.Equal("", area);
    }

    [Fact]
    public void Join_long_town_keeps_separate_parts()
    {
        var town12 = "123456789012";
        var (town, area) = AddressPrintJoin.ComputeTownAreaPrintJoin(town12, "9", 12);
        Assert.Equal(town12, town);
        Assert.Equal("9", area);
    }

    [Fact]
    public void FormatMemberAddressLine_matches_pref_city_town_area_concat()
    {
        var member = JsonNode.Parse(
            """{"Prefecture":"京都府","City":"京都市","TownArea":"北区","AreaNumber":"1"}"""
        )!;
        Assert.Equal("京都府京都市北区1", AddressPrintJoin.FormatMemberAddressLine(member));
    }
}
