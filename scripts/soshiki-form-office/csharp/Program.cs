using System.Text.Json.Nodes;

namespace Soshiki.Form.Pdf;

internal static class Program
{
    public static int Main(string[] args)
    {
        if (!TryParseArgs(args, out var jsonPath, out var repoRoot))
        {
            Console.Error.WriteLine("Usage: SoshikiFormPdf <submission.json> [--repo <repoRoot>]");
            return 1;
        }

        try
        {
            jsonPath = Path.GetFullPath(jsonPath!);
            if (!File.Exists(jsonPath))
            {
                throw new FileNotFoundException("JSON not found.", jsonPath);
            }

            repoRoot = Path.GetFullPath(repoRoot ?? RepoLocator.Find(AppContext.BaseDirectory));

            var layout = ReceptionPaths.FromSubmissionJson(jsonPath);
            var cellMap = JsonNode.Parse(File.ReadAllText(Path.Combine(repoRoot, "data", "soshiki-form-excel-cell-map.json")))!;
            var templateName = cellMap["templateFileName"]?.GetValue<string>()
                ?? throw new InvalidOperationException("templateFileName missing in cell map.");
            var templatePath = Path.Combine(layout.WebRoot, templateName);
            if (!File.Exists(templatePath))
            {
                throw new FileNotFoundException("Template not found.", templatePath);
            }

            var submission = JsonNode.Parse(File.ReadAllText(jsonPath))!;
            var unionMaster = JsonNode.Parse(File.ReadAllText(Path.Combine(repoRoot, "data", "union-master.json")))!;
            var kyosaiMap = JsonNode.Parse(File.ReadAllText(Path.Combine(repoRoot, "data", "form-kyosai-map.json")))!;

            var code = submission["KyosaikaiCode"]?.GetValue<string>() ?? "";
            var union = FindUnion(unionMaster, code)
                ?? throw new InvalidOperationException("union-master has no KyosaikaiCode=" + code);
            var kuchi = KuchiCalculator.Compute(union, kyosaiMap);

            Directory.CreateDirectory(layout.PdfDir);
            Console.WriteLine("Template: " + templatePath);
            ExcelExporter.FillAndExport(templatePath, layout.PdfPath, submission, union, kuchi, cellMap);
            Console.WriteLine("PDF: " + layout.PdfPath);
            return 0;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine(ex.Message);
            return 1;
        }
    }

    private static bool TryParseArgs(string[] args, out string? jsonPath, out string? repoRoot)
    {
        jsonPath = null;
        repoRoot = null;
        for (var i = 0; i < args.Length; i++)
        {
            if (args[i] == "--repo" && i + 1 < args.Length)
            {
                repoRoot = args[++i];
                continue;
            }

            if (!args[i].StartsWith('-', StringComparison.Ordinal))
            {
                jsonPath = args[i];
            }
        }

        return !string.IsNullOrWhiteSpace(jsonPath);
    }

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
