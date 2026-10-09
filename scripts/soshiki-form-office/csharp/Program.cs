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
            repoRoot ??= RepoLocator.Find(AppContext.BaseDirectory);
            SubmissionRunner.ExportPdf(jsonPath!, repoRoot);
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
}
