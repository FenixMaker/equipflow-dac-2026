"""Endereços IPv4 privados desta máquina (Wi‑Fi, Ethernet, mesma LAN)."""

import socket


def _is_private_lan(ip: str) -> bool:
    if ip.startswith("127."):
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
        return True
    return False


def _sort_key(ip: str) -> tuple[int, str]:
    if ip.startswith("192.168."):
        return (0, ip)
    if ip.startswith("10."):
        return (1, ip)
    if ip.startswith("172."):
        return (2, ip)
    return (3, ip)


def get_lan_ipv4_addresses() -> list[str]:
    """Lista IPs LAN usáveis no QR (exclui loopback)."""
    candidates: set[str] = set()
    try:
        hostname = socket.gethostname()
        for res in socket.getaddrinfo(hostname, None, family=socket.AF_INET):
            ip = res[4][0]
            if _is_private_lan(ip):
                candidates.add(ip)
    except OSError:
        pass
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
            sock.connect(("8.8.8.8", 80))
            ip = sock.getsockname()[0]
            if _is_private_lan(ip):
                candidates.add(ip)
    except OSError:
        pass
    return sorted(candidates, key=_sort_key)
