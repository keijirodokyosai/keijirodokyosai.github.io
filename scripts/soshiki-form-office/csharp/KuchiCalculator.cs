using System.Globalization;
using System.Text.Json.Nodes;

namespace Soshiki.Form.Pdf;

internal static class KuchiCalculator
{
    public static KuchiResult Compute(JsonNode union, JsonNode kyosaiMap)
    {
        var display = new Dictionary<int, double>();
        foreach (var item in union["Kyosai"]?.AsArray() ?? [])
        {
            if (item is null) continue;
            if (!item["KyosaiId"]!.TryGetValue<int>(out var id)) continue;
            var units = item["Units"]!.GetValue<double>();
            units = ApplyDisplayRule(id, units, kyosaiMap);
            display[id] = display.GetValueOrDefault(id) + units;
        }

        ApplySuppress(display, kyosaiMap["suppressKyosaiWhenPresent"]?.AsObject());
        var collectiveId = union["CollectiveKyosaiId"]!.GetValue<int>();
        var sogoIds = kyosaiMap["sogoCollectiveKyosaiIds"]?.AsArray().Select(n => n!.GetValue<int>()) ?? [];
        var isSogo = sogoIds.Contains(collectiveId);
        if (isSogo)
        {
            foreach (var hid in kyosaiMap["sogoHiddenKyosaiIds"]?.AsArray() ?? [])
            {
                if (hid is not null) display.Remove(hid.GetValue<int>());
            }
        }

        var result = new KuchiResult { KakekinPerPerson = union["KakekinPerPerson"]?.GetValue<int>() };
        foreach (var field in kyosaiMap["formFields"]?.AsArray() ?? [])
        {
            if (field is null) continue;
            var key = field["formKey"]?.GetValue<string>();
            var ids = field["kyosaiIds"]?.AsArray();
            if (string.IsNullOrEmpty(key) || ids is null) continue;
            double total = 0;
            foreach (var kid in ids)
            {
                if (kid is not null && display.TryGetValue(kid.GetValue<int>(), out var u)) total += u;
            }

            result.FormKuchi[key] = total > 0 ? FormatKuchi(total) : "";
        }

        if (isSogo)
        {
            var dk = 1;
            foreach (var field in kyosaiMap["formFields"]?.AsArray() ?? [])
            {
                if (field?["formKey"]?.GetValue<string>() == "sogo-kyosai" &&
                    field["displayKuchi"]?.TryGetValue<int>(out var d))
                {
                    dk = d;
                }
            }

            result.FormKuchi["sogo-kyosai"] = dk.ToString(CultureInfo.InvariantCulture);
        }
        else
        {
            result.FormKuchi["sogo-kyosai"] = "";
        }

        return result;
    }

    private static double ApplyDisplayRule(int kyosaiId, double units, JsonNode map)
    {
        JsonNode? rules = null;
        foreach (var field in map["formFields"]?.AsArray() ?? [])
        {
            if (field?["formKey"]?.GetValue<string>() == "keicho")
            {
                rules = field["kyosaiDisplayRules"];
            }
        }

        if (rules is null) return units;
        if (!rules.AsObject().TryGetValue(kyosaiId.ToString(), out var rule))
        {
            return units;
        }

        if (rule?["type"]?.GetValue<string>() != "unitsMultiply") return units;
        return units * rule["factor"]!.GetValue<double>();
    }

    private static void ApplySuppress(Dictionary<int, double> display, JsonObject? rules)
    {
        if (rules is null) return;
        foreach (var (trigger, hidden) in rules)
        {
            if (!int.TryParse(trigger, out var tid) || !display.ContainsKey(tid)) continue;
            foreach (var h in hidden?.AsArray() ?? [])
            {
                if (h is not null) display.Remove(h.GetValue<int>());
            }
        }
    }

    private static string FormatKuchi(double v) =>
        v == Math.Floor(v) ? ((int)v).ToString(CultureInfo.InvariantCulture) : v.ToString(CultureInfo.InvariantCulture);
}
