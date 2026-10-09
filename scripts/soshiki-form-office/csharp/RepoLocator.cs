namespace Soshiki.Form.Pdf;

internal static class RepoLocator
{
    public static string Find(string startDir)
    {
        var dir = Path.GetFullPath(startDir);
        for (var i = 0; i < 12; i++)
        {
            if (File.Exists(Path.Combine(dir, "data", "union-master.json")))
            {
                return dir;
            }

            var parent = Path.GetDirectoryName(dir);
            if (string.IsNullOrEmpty(parent) || parent == dir)
            {
                break;
            }

            dir = parent;
        }

        throw new InvalidOperationException("Cannot find repo data/union-master.json from: " + startDir);
    }
}
