using System.Text.Json.Nodes;

namespace Soshiki.Form.Pdf;

/// <summary>
/// Web <c>computeTownAreaPrintJoin</c> (js/soshiki-form-members.js) parity for Excel address line.
/// </summary>
internal static class AddressPrintJoin
{
    public const int TownCharLimit = 12;

    public static (string TownDisplay, string AreaDisplay) ComputeTownAreaPrintJoin(
        string? town,
        string? area,
        int townLimit = TownCharLimit)
    {
        var townText = (town ?? "").Trim();
        var areaText = (area ?? "").Trim();
        if (townText.Length == 0 || areaText.Length == 0)
        {
            return (townText, areaText);
        }

        if (townText.Length >= townLimit)
        {
            return (townText, areaText);
        }

        return (townText + areaText, "");
    }

    public static string FormatMemberAddressLine(JsonNode member, int townLimit = TownCharLimit)
    {
        var pref = member["Prefecture"]?.GetValue<string>() ?? "";
        return pref + FormatMemberAddressWithoutPrefecture(member, townLimit);
    }

    /// <summary>市区町村・町村域・番地（町村域12文字結合ルール）。都道府県は含めない。</summary>
    public static string FormatMemberAddressWithoutPrefecture(JsonNode member, int townLimit = TownCharLimit)
    {
        var city = member["City"]?.GetValue<string>() ?? "";
        var town = member["TownArea"]?.GetValue<string>() ?? "";
        var area = member["AreaNumber"]?.GetValue<string>() ?? "";
        var (townDisplay, areaDisplay) = ComputeTownAreaPrintJoin(town, area, townLimit);
        return city + townDisplay + areaDisplay;
    }
}
