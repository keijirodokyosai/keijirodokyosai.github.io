namespace Soshiki.Form.Pdf;

internal sealed record LayoutPaths(string WebRoot, string PdfDir, string PdfPath);

internal static class ReceptionPaths
{
    private const string ReceptionFolderName = "\u53D7\u4ED8";
    private const string JsonFolderName = "json";
    private const string ProcessedFolderName = "\u5904\u7406\u6E08\u307F";

    public static LayoutPaths FromSubmissionJson(string jsonFull)
    {
        var jsonDir = Path.GetDirectoryName(jsonFull) ?? "";
        var leaf = Path.GetFileName(jsonDir);
        if (leaf != JsonFolderName && leaf != ProcessedFolderName)
        {
            throw new InvalidOperationException(
                "JSON must be under .../RECEPTION_MONTH/json/ or .../処理済み/ (got: " + jsonDir + ")");
        }

        var monthDir = Path.GetDirectoryName(jsonDir) ?? "";
        var receptionDir = Path.GetDirectoryName(monthDir) ?? "";
        if (Path.GetFileName(receptionDir) != ReceptionFolderName)
        {
            throw new InvalidOperationException(
                "Reception folder must be named " + ReceptionFolderName +
                " (got: " + Path.GetFileName(receptionDir) + ")");
        }

        var webRoot = Path.GetDirectoryName(receptionDir) ?? "";
        var stem = Path.GetFileNameWithoutExtension(jsonFull);
        var pdfDir = Path.Combine(monthDir, "pdf");
        return new LayoutPaths(webRoot, pdfDir, Path.Combine(pdfDir, stem + ".pdf"));
    }
}
