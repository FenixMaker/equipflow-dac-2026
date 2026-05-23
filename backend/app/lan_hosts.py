"""Endereços IPv4 privados desta máquina (Wi‑Fi, Ethernet, mesma LAN)."""

from __future__ import annotations

import platform
import re
import socket
import subprocess
from typing import TypedDict


class LanInterface(TypedDict):
    ip: str
    name: str
    kind: str  # ethernet | wifi | other


def _is_private_lan(ip: str) -> bool:
    if ip.startswith("127.") or ip.startswith("169.254."):
        return False
    try:
        parts = [int(x) for x in ip.split(".")]
    except ValueError:
        return False
    if len(parts) != 4:
        return False
    if parts[0] == 10:
        return True
    if parts[0] == 192 and parts[1] == 168:
        return True
    if parts[0] == 172 and 16 <= parts[1] <= 31:
        return False  # exclui Hyper-V / WSL típicos 172.16–31
    return False


def _interface_kind(name: str) -> str:
    lower = name.lower()
    if any(k in lower for k in ("ethernet", "eth", "en0", "cabo", "realtek", "intel")):
        if "virtual" in lower or "vethernet" in lower or "hyper-v" in lower or "wsl" in lower:
            return "other"
        return "ethernet"
    if any(k in lower for k in ("wi-fi", "wifi", "wlan", "wireless", "802.11")):
        return "wifi"
    return "other"


def _sort_iface_key(item: LanInterface) -> tuple[int, str]:
    kind_order = {"ethernet": 0, "wifi": 1, "other": 2}
    ip = item["ip"]
    ip_order = 0 if ip.startswith("192.168.") else (1 if ip.startswith("10.") else 2)
    return (kind_order.get(item["kind"], 9), ip_order, ip)


def _ips_from_ipconfig_windows() -> list[LanInterface]:
    try:
        raw = subprocess.check_output(
            ["ipconfig", "/all"],
            text=True,
            encoding="utf-8",
            errors="ignore",
            timeout=8,
        )
    except (OSError, subprocess.SubprocessError):
        return []

    results: list[LanInterface] = []
    current_name = ""
    for line in raw.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        # "Adaptador de Ethernet Ethernet:" ou "Ethernet adapter Ethernet:"
        lower = stripped.lower()
        is_adapter = stripped.endswith(":") and (
            "adapter" in lower or lower.startswith("adaptador")
        )
        if is_adapter:
            current_name = stripped.rstrip(":").strip()
            for prefix in ("adaptador de ", "adaptador ", "ethernet adapter ", "wireless lan adapter "):
                if current_name.lower().startswith(prefix):
                    current_name = current_name[len(prefix) :]
                    break
            continue
        if not current_name:
            continue
        if "ipv4" in stripped.lower() or "endereço ipv4" in stripped.lower():
            match = re.search(r"(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})", stripped)
            if match:
                ip = match.group(1)
                if _is_private_lan(ip):
                    results.append(
                        {
                            "ip": ip,
                            "name": current_name,
                            "kind": _interface_kind(current_name),
                        }
                    )
    return results


def _ips_from_hostname() -> list[LanInterface]:
    found: list[LanInterface] = []
    try:
        hostname = socket.gethostname()
        for res in socket.getaddrinfo(hostname, None, family=socket.AF_INET):
            ip = res[4][0]
            if _is_private_lan(ip):
                found.append({"ip": ip, "name": hostname, "kind": "other"})
    except OSError:
        pass
    return found


def _ip_from_default_route() -> str | None:
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
            sock.connect(("8.8.8.8", 80))
            ip = sock.getsockname()[0]
            if _is_private_lan(ip):
                return ip
    except OSError:
        pass
    return None


def get_lan_interfaces() -> list[LanInterface]:
    """Interfaces LAN com IP privado (prioriza Ethernet no QR)."""
    by_ip: dict[str, LanInterface] = {}

    if platform.system() == "Windows":
        for item in _ips_from_ipconfig_windows():
            by_ip[item["ip"]] = item

    route_ip = _ip_from_default_route()
    if route_ip and route_ip not in by_ip:
        by_ip[route_ip] = {"ip": route_ip, "name": "Rota padrão", "kind": "ethernet"}

    for item in _ips_from_hostname():
        if item["ip"] not in by_ip:
            by_ip[item["ip"]] = item

    return sorted(by_ip.values(), key=_sort_iface_key)


def get_lan_ipv4_addresses() -> list[str]:
    return [x["ip"] for x in get_lan_interfaces()]


def pick_recommended_lan_ip() -> str | None:
    interfaces = get_lan_interfaces()
    if not interfaces:
        return None
    for kind in ("ethernet", "wifi", "other"):
        for item in interfaces:
            if item["kind"] == kind:
                return item["ip"]
    return interfaces[0]["ip"]
