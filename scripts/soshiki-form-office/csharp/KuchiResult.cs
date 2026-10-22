namespace Soshiki.Form.Pdf;

internal sealed class KuchiResult
{
    public Dictionary<string, string> FormKuchi { get; } = new();
    public object? KakekinPerPerson { get; set; }
}
