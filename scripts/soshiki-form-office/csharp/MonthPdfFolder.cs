namespace Soshiki.Form.Pdf;

internal static class MonthPdfFolder
{
    public const string Name = "PDF";

    /// <summary>
    /// Ensures month\PDF exists. On Windows, renames an existing pdf/Pdf folder to PDF (case-only).
    /// </summary>
    public static string EnsureInMonth(string monthDir)
    {
        monthDir = Path.GetFullPath(monthDir);
        var target = Path.Combine(monthDir, Name);

        if (OperatingSystem.IsWindows())
        {
            TryNormalizeExistingFolderCase(monthDir);
        }

        Directory.CreateDirectory(target);
        return target;
    }

    private static void TryNormalizeExistingFolderCase(string monthDir)
    {
        if (!Directory.Exists(monthDir))
        {
            return;
        }

        foreach (var dir in Directory.GetDirectories(monthDir))
        {
            var leaf = Path.GetFileName(dir);
            if (!string.Equals(leaf, Name, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (string.Equals(leaf, Name, StringComparison.Ordinal))
            {
                return;
            }

            var temp = Path.Combine(monthDir, ".soshiki-pdf-rename-" + Guid.NewGuid().ToString("N"));
            Directory.Move(dir, temp);
            Directory.Move(temp, Path.Combine(monthDir, Name));
            return;
        }
    }
}
