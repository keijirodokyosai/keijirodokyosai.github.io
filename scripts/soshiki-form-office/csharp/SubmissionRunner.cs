using System.Text.Json.Nodes;

namespace Soshiki.Form.Pdf;

internal static class SubmissionRunner
{
    public static void ExportPdf(string jsonPath, string repoRoot)
    {
        jsonPath = Path.GetFullPath(jsonPath);
        repoRoot = Path.GetFullPath(repoRoot);

        if (!File.Exists(jsonPath))
        {
            throw new FileNotFoundException("JSON not found.", jsonPath);
        }

        var layout = ReceptionPaths.FromSubmissionJson(jsonPath);
        var cellMapPath = Path.Combine(repoRoot, "data", "soshiki-form-excel-cell-map.json");
        var cellMap = LoadJson(cellMapPath);
        var memberMap = cellMap["member"]!;
        Console.WriteLine(
            "Cell map: " + cellMapPath +
            " | kanji " + memberMap["familyNameCol"] + "/" + memberMap["givenNameCol"] +
            " | kana " + memberMap["familyNameKanaCol"] + "/" + memberMap["givenNameKanaCol"]);
        var templateName = cellMap["templateFileName"]?.GetValue<string>()
            ?? throw new InvalidOperationException("templateFileName missing in cell map.");
        var templatePath = Path.Combine(layout.WebRoot, templateName);
        if (!File.Exists(templatePath))
        {
            throw new FileNotFoundException("Template not found.", templatePath);
        }

        var submission = LoadJson(jsonPath);
        var unionMaster = LoadJson(Path.Combine(repoRoot, "data", "union-master.json"));
        var kyosaiMap = LoadJson(Path.Combine(repoRoot, "data", "form-kyosai-map.json"));

        var code = submission["KyosaikaiCode"]?.GetValue<string>() ?? "";
        var union = FindUnion(unionMaster, code)
            ?? throw new InvalidOperationException("union-master has no KyosaikaiCode=" + code);
        var kuchi = KuchiCalculator.Compute(union, kyosaiMap);

        Directory.CreateDirectory(layout.PdfDir);
        Console.WriteLine("Template: " + templatePath);
        ExcelExporter.FillAndExport(templatePath, layout.PdfPath, submission, union, kuchi, cellMap);
        Console.WriteLine("PDF: " + layout.PdfPath);
    }

    private static JsonNode LoadJson(string path) =>
        JsonNode.Parse(File.ReadAllText(path)) ?? throw new InvalidOperationException("Invalid JSON: " + path);

    private static JsonNode? FindUnion(JsonNode unionMaster, string code)
    {
        foreach (var u in unionMaster["unions"]?.AsArray() ?? [])
        {
            if (u?["KyosaikaiCode"]?.GetValue<string>() == code)
            {
                return u;
            }
        }

        return null;
    }
}
