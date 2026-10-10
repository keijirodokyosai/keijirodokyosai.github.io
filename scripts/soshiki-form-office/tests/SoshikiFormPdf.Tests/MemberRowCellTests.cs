using System.Text.Json.Nodes;
using Xunit;

namespace Soshiki.Form.Pdf.Tests;

/// <summary>
/// ExcelExporter と同じ行オフセット・セル列（cell-map）の整合性。
/// </summary>
public sealed class MemberRowCellTests
{
    private static JsonNode LoadCellMap()
    {
        var repoRoot = RepoLocator.Find(AppContext.BaseDirectory);
        var path = Path.Combine(repoRoot, "data", "soshiki-form-excel-cell-map.json");
        return JsonNode.Parse(File.ReadAllText(path))!;
    }

    private static (int kanaRow, int mainRow, int buildingRow) RowsForMember(JsonNode cellMap, int rowIndex)
    {
        var step = cellMap["memberRowStep"]!.GetValue<int>();
        var baseKana = cellMap["memberRowBase"]!["kana"]!.GetValue<int>();
        var baseMain = cellMap["memberRowBase"]!["main"]!.GetValue<int>();
        var baseBuilding = cellMap["memberRowBase"]!["building"]!.GetValue<int>();
        var off = (rowIndex - 1) * step;
        return (baseKana + off, baseMain + off, baseBuilding + off);
    }

    [Theory]
    [InlineData(1, 12, 13, 14)]
    [InlineData(2, 15, 16, 17)]
    [InlineData(3, 18, 19, 20)]
    [InlineData(4, 21, 22, 23)]
    [InlineData(5, 24, 25, 26)]
    public void Member_row_offsets_use_step_3(int rowIndex, int kana, int main, int building)
    {
        var cellMap = LoadCellMap();
        var rows = RowsForMember(cellMap, rowIndex);
        Assert.Equal(kana, rows.kanaRow);
        Assert.Equal(main, rows.mainRow);
        Assert.Equal(building, rows.buildingRow);
    }

    [Theory]
    [InlineData(1, "W13", "AA13", "AC13")]
    [InlineData(2, "W16", "AA16", "AC16")]
    [InlineData(3, "W19", "AA19", "AC19")]
    [InlineData(4, "W22", "AA22", "AC22")]
    [InlineData(5, "W25", "AA25", "AC25")]
    public void Birth_date_cells_share_main_row_for_all_members(
        int rowIndex,
        string yearCell,
        string monthCell,
        string dayCell)
    {
        var cellMap = LoadCellMap();
        var m = cellMap["member"]!;
        var (_, mainRow, _) = RowsForMember(cellMap, rowIndex);

        Assert.Equal(yearCell, $"{m["birthYearCol"]!.GetValue<string>()}{mainRow}");
        Assert.Equal(monthCell, $"{m["birthMonthCol"]!.GetValue<string>()}{mainRow}");
        Assert.Equal(dayCell, $"{m["birthDayCol"]!.GetValue<string>()}{mainRow}");
    }

    [Theory]
    [InlineData(1, "E12", "M12", "AO12", "K13", "AE13", "AG13", "AG14")]
    [InlineData(2, "E15", "M15", "AO15", "K16", "AE16", "AG16", "AG17")]
    public void Key_member_fields_use_kana_or_main_or_building_rows(
        int rowIndex,
        string unionStart,
        string kanaCol,
        string prefecture,
        string familyKanji,
        string gender,
        string address,
        string building)
    {
        var cellMap = LoadCellMap();
        var m = cellMap["member"]!;
        var (kanaRow, mainRow, buildingRow) = RowsForMember(cellMap, rowIndex);
        var unionCols = m["unionMemberCodeCols"]!.AsArray();

        Assert.Equal(unionStart, $"{unionCols[0]!.GetValue<string>()}{kanaRow}");
        Assert.Equal(kanaCol, $"{m["familyNameKanaCol"]!.GetValue<string>()}{kanaRow}");
        Assert.Equal(prefecture, $"{m["prefectureCol"]!.GetValue<string>()}{kanaRow}");
        Assert.Equal(familyKanji, $"{m["familyNameCol"]!.GetValue<string>()}{mainRow}");
        Assert.Equal(gender, $"{m["genderCol"]!.GetValue<string>()}{mainRow}");
        Assert.Equal(address, $"{m["addressLineCol"]!.GetValue<string>()}{mainRow}");
        Assert.Equal(building, $"{m["buildingCol"]!.GetValue<string>()}{buildingRow}");
    }
}
