# 組織共済 — union-master + form-kyosai-map から口数・掛金（js/soshiki-form-enter.js computeFormKuchi 相当）

function Get-SoshikiFormKuchiResult {
    param(
        [Parameter(Mandatory = $true)]
        $Union,
        [Parameter(Mandatory = $true)]
        $KyosaiMap
    )

    if (-not $Union -or -not $KyosaiMap) {
        return $null
    }

    $displayUnits = @{}

    foreach ($item in @($Union.Kyosai)) {
        if (-not $item.KyosaiId) { continue }
        $units = [double]$item.Units
        if ([double]::IsNaN($units)) { continue }
        $kyosaiId = [int]$item.KyosaiId
        $display = Get-KyosaiDisplayUnits -KyosaiId $kyosaiId -Units $units -KyosaiMap $KyosaiMap
        if (-not $displayUnits.ContainsKey($kyosaiId)) {
            $displayUnits[$kyosaiId] = 0
        }
        $displayUnits[$kyosaiId] += $display
    }

    Apply-SuppressKyosaiRules -DisplayUnits $displayUnits -SuppressRules $KyosaiMap.suppressKyosaiWhenPresent

    $collectiveId = [int]$Union.CollectiveKyosaiId
    $isSogo = @($KyosaiMap.sogoCollectiveKyosaiIds) -contains $collectiveId

    if ($isSogo) {
        foreach ($hiddenId in @($KyosaiMap.sogoHiddenKyosaiIds)) {
            $displayUnits.Remove([int]$hiddenId)
        }
    }

    $formKuchi = @{}
    foreach ($field in @($KyosaiMap.formFields)) {
        if (-not $field.formKey -or -not $field.kyosaiIds) { continue }
        $total = 0
        foreach ($kid in @($field.kyosaiIds)) {
            $id = [int]$kid
            if ($displayUnits.ContainsKey($id)) {
                $total += $displayUnits[$id]
            }
        }
        if ($total -gt 0) {
            $formKuchi[$field.formKey] = Format-KuchiValue $total
        } else {
            $formKuchi[$field.formKey] = ""
        }
    }

    $sogoField = @($KyosaiMap.formFields) | Where-Object { $_.formKey -eq "sogo-kyosai" } | Select-Object -First 1
    if ($isSogo) {
        $dk = 1
        if ($sogoField -and $sogoField.displayKuchi) {
            $dk = [int]$sogoField.displayKuchi
        }
        $formKuchi["sogo-kyosai"] = [string]$dk
    } else {
        $formKuchi["sogo-kyosai"] = ""
    }

    return @{
        formKuchi       = $formKuchi
        KakekinPerPerson = $Union.KakekinPerPerson
    }
}

function Get-KyosaiDisplayUnits {
    param(
        [int]$KyosaiId,
        [double]$Units,
        $KyosaiMap
    )

    $keichoField = @($KyosaiMap.formFields) | Where-Object { $_.formKey -eq "keicho" } | Select-Object -First 1
    $rules = $keichoField.kyosaiDisplayRules
    if (-not $rules) { return $Units }

    $rule = $null
    if ($rules.PSObject.Properties.Name -contains [string]$KyosaiId) {
        $rule = $rules.([string]$KyosaiId)
    } elseif ($rules.PSObject.Properties.Name -contains $KyosaiId) {
        $rule = $rules.$KyosaiId
    }

    if (-not $rule -or $rule.type -ne "unitsMultiply") {
        return $Units
    }
    return $Units * [double]$rule.factor
}

function Apply-SuppressKyosaiRules {
    param(
        $DisplayUnits,
        $SuppressRules
    )

    if (-not $SuppressRules) { return }

    foreach ($prop in $SuppressRules.PSObject.Properties) {
        $triggerId = [int]$prop.Name
        if (-not $DisplayUnits.ContainsKey($triggerId)) { continue }
        foreach ($hiddenId in @($prop.Value)) {
            $hid = [int]$hiddenId
            if ($DisplayUnits.ContainsKey($hid)) {
                $DisplayUnits.Remove($hid)
            }
        }
    }
}

function Format-KuchiValue {
    param([double]$Value)
    if ($Value -eq [math]::Floor($Value)) {
        return [string][int]$Value
    }
    return [string]$Value
}

function Find-UnionByKyosaikaiCode {
    param(
        $UnionMaster,
        [string]$KyosaikaiCode
    )

    if (-not $UnionMaster -or -not $KyosaikaiCode) { return $null }
    return @($UnionMaster.unions) | Where-Object { $_.KyosaikaiCode -eq $KyosaikaiCode } | Select-Object -First 1
}
