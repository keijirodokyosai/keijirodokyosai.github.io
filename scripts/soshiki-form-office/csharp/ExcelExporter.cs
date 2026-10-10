using System.Globalization;
using System.Text.Json.Nodes;

namespace Soshiki.Form.Pdf;

internal static class ExcelExporter
{
    public static void FillAndExport(
        string templatePath,
        string outputPdf,
        JsonNode submission,
        JsonNode union,
        KuchiResult kuchi,
        JsonNode cellMap)
    {
        dynamic app = Activator.CreateInstance(Type.GetTypeFromProgID("Excel.Application")!)
            ?? throw new InvalidOperationException("Excel.Application not registered.");
        app.DisplayAlerts = false;
        try
        {
            dynamic book = app.Workbooks.Open(templatePath);
            try
            {
                dynamic sheet = book.Worksheets[1];
                FillSheet(sheet, submission, union, kuchi, cellMap);
                var tempPdf = Path.Combine(Path.GetTempPath(), "soshiki-" + Guid.NewGuid().ToString("N") + ".pdf");
                try
                {
                    book.ExportAsFixedFormat(0, tempPdf);
                    File.Copy(tempPdf, outputPdf, true);
                }
                finally
                {
                    if (File.Exists(tempPdf))
                    {
                        File.Delete(tempPdf);
                    }
                }
            }
            finally
            {
                book.Saved = true;
                book.Close(false);
            }
        }
        finally
        {
            app.UserControl = false;
            app.Quit();
        }
    }

    private static void FillSheet(dynamic sheet, JsonNode submission, JsonNode union, KuchiResult kuchi, JsonNode cellMap)
    {
        var h = cellMap["header"]!;
        var appDate = submission["ApplicationDate"]!;
        Set(sheet, h["applicationYear"]!.GetValue<string>(), appDate["Year"]?.GetValue<string>());
        Set(sheet, h["applicationMonth"]!.GetValue<string>(), IntNoPad(appDate["Month"]?.GetValue<string>()));
        Set(sheet, h["applicationDay"]!.GetValue<string>(), IntNoPad(appDate["Day"]?.GetValue<string>()));
        Set(sheet, h["unionName"]!.GetValue<string>(), union["KyosaikaiName"]?.GetValue<string>());

        WriteThree(sheet, h["industryCode"]!, submission["IndustryCode"]?.GetValue<string>());
        WriteThree(sheet, h["branchCode"]!, submission["BranchCode"]?.GetValue<string>());
        WriteThree(sheet, h["subbranchCode"]!, submission["SubbranchCode"]?.GetValue<string>());

        foreach (var prop in h["units"]!.AsObject())
        {
            kuchi.FormKuchi.TryGetValue(prop.Key, out var val);
            Set(sheet, prop.Value!.GetValue<string>(), val);
        }

        Set(sheet, h["premiumPerPerson"]!.GetValue<string>(), kuchi.KakekinPerPerson);

        var footer = cellMap["footer"]!;
        var sf = submission["SheetFooter"]!;
        Set(sheet, footer["pageCountCurrent"]!.GetValue<string>(), sf["PageCountCurrent"]?.GetValue<string>());
        Set(sheet, footer["pageCountTotal"]!.GetValue<string>(), sf["PageCountTotal"]?.GetValue<string>());
        Set(sheet, footer["priorMonthHeadcount"]!.GetValue<string>(), sf["PriorMonthHeadcount"]?.GetValue<string>());
        Set(sheet, footer["coverageMonth"]!.GetValue<string>(), CoverageMonth(submission, appDate));
        var prior = int.TryParse(sf["PriorMonthHeadcount"]?.GetValue<string>(), out var p) ? p : 0;
        Set(sheet, footer["monthTotal"]!.GetValue<string>(), MonthTotal(prior, submission["Members"]?.AsArray()));
        Set(sheet, footer["remarks"]!.GetValue<string>(), sf["Remarks"]?.GetValue<string>());

        var m = cellMap["member"]!;
        var step = cellMap["memberRowStep"]!.GetValue<int>();
        var baseKana = cellMap["memberRowBase"]!["kana"]!.GetValue<int>();
        var baseMain = cellMap["memberRowBase"]!["main"]!.GetValue<int>();
        var baseBuilding = cellMap["memberRowBase"]!["building"]!.GetValue<int>();

        foreach (var member in submission["Members"]?.AsArray() ?? [])
        {
            if (member is null) continue;
            var rowIndex = member["Row"]?.GetValue<int>() ?? 0;
            if (rowIndex < 1 || rowIndex > 5) continue;
            var off = (rowIndex - 1) * step;
            var kanaRow = baseKana + off;
            var mainRow = baseMain + off;
            var buildingRow = baseBuilding + off;

            Set(sheet, $"{m["transferCol"]!.GetValue<string>()}{kanaRow}", TransferLabel(member["Transfer"]?.GetValue<string>()));
            WriteSix(sheet, m["unionMemberCodeCols"]!.AsArray(), mainRow, member["UnionMemberCode"]?.GetValue<string>());

            Set(sheet, $"{m["familyNameKanaCol"]!.GetValue<string>()}{kanaRow}", member["FamilyNameKana"]?.GetValue<string>());
            Set(sheet, $"{m["givenNameKanaCol"]!.GetValue<string>()}{kanaRow}", member["GivenNameKana"]?.GetValue<string>());
            Set(sheet, $"{m["familyNameCol"]!.GetValue<string>()}{mainRow}", member["FamilyName"]?.GetValue<string>());
            Set(sheet, $"{m["givenNameCol"]!.GetValue<string>()}{mainRow}", member["GivenName"]?.GetValue<string>());

            var birth = ParseBirth(member["BirthDate"]?.GetValue<string>());
            Set(sheet, $"{m["birthYearCol"]!.GetValue<string>()}{mainRow}", birth.Year);
            if (rowIndex == 1 && m["firstMemberBirthMonth"] is not null)
            {
                Set(sheet, m["firstMemberBirthMonth"]!.GetValue<string>(), birth.Month);
            }
            else
            {
                Set(sheet, $"{m["birthMonthCol"]!.GetValue<string>()}{mainRow}", birth.Month);
            }
            Set(sheet, $"{m["birthDayCol"]!.GetValue<string>()}{mainRow}", birth.Day);
            Set(sheet, $"{m["postalCodeCol"]!.GetValue<string>()}{kanaRow}", member["PostalCode"]?.GetValue<string>());
            Set(sheet, $"{m["genderCol"]!.GetValue<string>()}{mainRow}", GenderLabel(member["Gender"]?.GetValue<string>()));

            Set(sheet, $"{m["addressLineCol"]!.GetValue<string>()}{mainRow}", AddressPrintJoin.FormatMemberAddressLine(member));
            Set(sheet, $"{m["buildingCol"]!.GetValue<string>()}{buildingRow}", member["BuildingName"]?.GetValue<string>());
        }
    }

    /// <summary>
    /// 1セル（または結合セル全体）に文字列をそのまま書く。結合は解除しない。
    /// 1桁ずつ分割するのは <see cref="WriteThree"/> / <see cref="WriteSix"/>（コード欄のみ）。
    /// </summary>
    private static void Set(dynamic sheet, string address, object? value)
    {
        if (value is null) return;
        var text = $"{value}".Trim();
        if (text.Length == 0) return;

        dynamic range = sheet.Range[address];
        if (IsMergedExcelRange(range))
        {
            range.MergeArea.Value2 = text;
        }
        else
        {
            range.Value2 = text;
        }
    }

    private static bool IsMergedExcelRange(dynamic range)
    {
        try
        {
            return (bool)range.MergeCells;
        }
        catch
        {
            try
            {
                return Convert.ToInt32(range.MergeCells, CultureInfo.InvariantCulture) != 0;
            }
            catch
            {
                return false;
            }
        }
    }

    private static void WriteThree(dynamic sheet, JsonNode colsDef, string? code)
    {
        var cols = colsDef["cols"]!.AsArray();
        var row = colsDef["row"]!.GetValue<int>();
        var digits = PadLeftDigits(code, 3);
        for (var i = 0; i < 3; i++)
        {
            Set(sheet, $"{cols[i]!.GetValue<string>()}{row}", digits[i].ToString());
        }
    }

    private static void WriteSix(dynamic sheet, JsonArray cols, int row, string? code)
    {
        var digits = new string((code ?? "").Where(char.IsDigit).ToArray());
        if (digits.Length == 0) return;
        digits = digits.PadLeft(6, '0');
        if (digits.Length > 6) digits = digits[^6..];
        for (var i = 0; i < 6; i++)
        {
            Set(sheet, $"{cols[i]!.GetValue<string>()}{row}", digits[i].ToString());
        }
    }

    private static string PadLeftDigits(string? code, int len)
    {
        var d = (code ?? "").Trim();
        if (d.Length < len) d = d.PadLeft(len, '0');
        if (d.Length > len) d = d[^len..];
        return d;
    }

    private static string? IntNoPad(string? t)
    {
        if (string.IsNullOrWhiteSpace(t)) return "";
        return int.Parse(t.Trim(), CultureInfo.InvariantCulture).ToString(CultureInfo.InvariantCulture);
    }

    private static string TransferLabel(string? t) => (t ?? "").Trim() switch
    {
        "New" => "\u65B0\u898F",
        "Cancel" => "\u89E3\u7D04",
        "Change" => "\u5909\u66F4",
        _ => ""
    };

    private static string GenderLabel(string? g) => (g ?? "").Trim() switch
    {
        "1" => "\u7537",
        "2" => "\u5973",
        _ => ""
    };

    private static (string Year, string Month, string Day) ParseBirth(string? birth)
    {
        var parts = (birth ?? "").Trim().Split('/');
        if (parts.Length < 3) return ("", "", "");
        return (parts[0].Trim(), IntNoPad(parts[1]) ?? "", IntNoPad(parts[2]) ?? "");
    }

    private static string CoverageMonth(JsonNode submission, JsonNode appDate)
    {
        var cm = submission["CoverageMonth"];
        if (cm is not null)
        {
            var monthText = IntNoPad(cm["Month"]?.GetValue<string>());
            if (!string.IsNullOrEmpty(monthText))
            {
                return monthText;
            }
        }

        if (!int.TryParse(appDate["Year"]?.GetValue<string>(), out _) ||
            !int.TryParse(appDate["Month"]?.GetValue<string>(), out var appMonth) || appMonth == 0)
        {
            return "";
        }

        return appMonth == 12 ? "1" : (appMonth + 1).ToString(CultureInfo.InvariantCulture);
    }

    private static string MonthTotal(int prior, JsonArray? members)
    {
        var added = 0;
        var removed = 0;
        foreach (var mem in members ?? [])
        {
            switch ((mem?["Transfer"]?.GetValue<string>() ?? "").Trim())
            {
                case "New": added++; break;
                case "Cancel": removed++; break;
            }
        }

        var total = prior + added - removed;
        return (total < 0 ? 0 : total).ToString(CultureInfo.InvariantCulture);
    }
}
