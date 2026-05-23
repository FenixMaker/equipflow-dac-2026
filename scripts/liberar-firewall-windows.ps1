# Libera portas do EquipFlow no Firewall do Windows (rede privada).
# Execute como Administrador: clique direito -> "Executar com PowerShell" (Admin)
# ou: powershell -ExecutionPolicy Bypass -File scripts\liberar-firewall-windows.ps1

$ErrorActionPreference = 'Stop'

$rules = @(
    @{ Name = 'EquipFlow Vite 5173'; Port = 5173; Proto = 'TCP' },
    @{ Name = 'EquipFlow API 8000'; Port = 8000; Proto = 'TCP' }
)

foreach ($r in $rules) {
    $existing = Get-NetFirewallRule -DisplayName $r.Name -ErrorAction SilentlyContinue
    if ($existing) {
        Write-Host "Regra ja existe: $($r.Name)"
        continue
    }
    New-NetFirewallRule -DisplayName $r.Name `
        -Direction Inbound `
        -Action Allow `
        -Protocol $r.Proto `
        -LocalPort $r.Port `
        -Profile Private, Domain `
        | Out-Null
    Write-Host "Criada regra: $($r.Name) (porta $($r.Port))"
}

Write-Host ''
Write-Host 'Pronto. Teste no celular o QR ou http://IP_DO_PC:5173' -ForegroundColor Green
Write-Host 'Se o celular estiver em Wi-Fi de convidado, use a rede principal do roteador.'
