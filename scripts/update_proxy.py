#!/usr/bin/env python3
"""
DrGame Platform — V2Ray/Xray Subscription Converter & Proxy Config Generator
Fetches subscription link from .env (V2RAY_SUB_URL) or CLI argument, parses VLESS/VMESS nodes,
and generates a production-ready /etc/xray/config.json for the Docker proxy sidecar.
"""

import os
import sys
import json
import base64
import urllib.request
import urllib.parse
from pathlib import Path


def load_env_var(var_name: str, env_files=None) -> str | None:
    """Read an environment variable from system env or specified .env files."""
    if os.environ.get(var_name):
        return os.environ[var_name]

    if env_files is None:
        base_dir = Path(__file__).resolve().parent.parent
        env_files = [
            base_dir / ".env",
            base_dir / ".env.prod",
            base_dir / ".env.prod.example",
        ]

    for env_path in env_files:
        if env_path.is_file():
            try:
                with open(env_path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if not line or line.startswith("#") or "=" not in line:
                            continue
                        k, v = line.split("=", 1)
                        if k.strip() == var_name:
                            val = v.strip().strip("'\"")
                            if val:
                                return val
            except Exception:
                pass
    return None


def fetch_subscription(sub_url: str) -> str:
    """Download subscription payload and decode Base64."""
    req = urllib.request.Request(
        sub_url,
        headers={"User-Agent": "v2rayN/6.23 (Windows NT 10.0; Win64; x64)"}
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        raw_data = resp.read().decode("utf-8", errors="ignore").strip()

    # Add base64 padding if required
    pad = len(raw_data) % 4
    if pad:
        raw_data += "=" * (4 - pad)

    try:
        decoded = base64.b64decode(raw_data).decode("utf-8", errors="ignore")
        return decoded
    except Exception as e:
        raise ValueError(f"Failed to decode subscription base64: {e}")


def parse_vless_url(vless_url: str) -> dict | None:
    """Parse a vless:// URL into an Xray outbound dictionary."""
    try:
        parsed = urllib.parse.urlparse(vless_url)
        if parsed.scheme != "vless":
            return None

        uuid = parsed.username
        address = parsed.hostname
        port = parsed.port or 443
        remarks = urllib.parse.unquote(parsed.fragment or "VLESS_Node")
        query = urllib.parse.parse_qs(parsed.query)

        def q(key, default=""):
            return query.get(key, [default])[0]

        net_type = q("type", "tcp").lower()
        security = q("security", "none").lower()
        sni = q("sni") or q("host") or address
        host_header = q("host") or sni
        path = q("path", "/")
        fp = q("fp", "chrome")
        alpn = query.get("alpn", ["http/1.1"])

        outbound = {
            "tag": remarks,
            "protocol": "vless",
            "settings": {
                "vnext": [
                    {
                        "address": address,
                        "port": port,
                        "users": [
                            {
                                "id": uuid,
                                "encryption": "none",
                                "level": 0
                            }
                        ]
                    }
                ]
            },
            "streamSettings": {
                "network": net_type,
                "security": security
            }
        }

        # TLS settings
        if security == "tls":
            outbound["streamSettings"]["tlsSettings"] = {
                "serverName": sni,
                "allowInsecure": False,
                "fingerprint": fp,
                "alpn": alpn if isinstance(alpn, list) else [alpn]
            }

        # Transport network settings
        if net_type == "ws":
            outbound["streamSettings"]["wsSettings"] = {
                "path": path,
                "host": host_header,
                "headers": {
                    "Host": host_header
                }
            }
        elif net_type == "grpc":
            service_name = q("serviceName", "grpc")
            outbound["streamSettings"]["grpcSettings"] = {
                "serviceName": service_name,
                "multiMode": False
            }
        elif net_type == "tcp":
            header_type = q("headerType", "none")
            if header_type == "http":
                outbound["streamSettings"]["tcpSettings"] = {
                    "header": {
                        "type": "http",
                        "request": {
                            "version": "1.1",
                            "method": "GET",
                            "path": [path],
                            "headers": {
                                "Host": [host_header],
                                "User-Agent": [
                                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                                ]
                            }
                        }
                    }
                }

        return {
            "outbound": outbound,
            "net_type": net_type,
            "security": security,
            "remarks": remarks,
            "address": address,
            "port": port
        }
    except Exception as e:
        print(f"Warning: Failed to parse node '{vless_url[:30]}...': {e}", file=sys.stderr)
        return None


def generate_xray_config(nodes: list[dict]) -> dict:
    """Generate complete Xray configuration with HTTP/SOCKS inbounds and best outbound."""
    if not nodes:
        raise ValueError("No valid nodes found in subscription.")

    # In modern Xray, unencrypted VLESS without TLS/Reality is rejected by core
    valid_nodes = [n for n in nodes if n["security"] in ("tls", "reality")]
    if not valid_nodes:
        valid_nodes = nodes  # fallback if all are plain

    # Rank nodes: WebSocket + TLS is the most resilient against Iran DPI filtering
    def score_node(n):
        score = 0
        if n["net_type"] == "ws":
            score += 100
        elif n["net_type"] == "xhttp":
            score += 80
        elif n["net_type"] == "grpc":
            score += 70
        elif n["net_type"] == "tcp":
            score += 50
        if n["security"] == "tls":
            score += 50
        return score

    sorted_nodes = sorted(valid_nodes, key=score_node, reverse=True)
    best_node = sorted_nodes[0]

    # Primary outbound is tagged as 'proxy'
    primary_outbound = dict(best_node["outbound"])
    primary_outbound["tag"] = "proxy"

    outbounds = [
        primary_outbound,
        {
            "tag": "direct",
            "protocol": "freedom",
            "settings": {}
        },
        {
            "tag": "block",
            "protocol": "blackhole",
            "settings": {}
        }
    ]

    # Add other nodes as fallback tags
    for i, n in enumerate(sorted_nodes[1:], start=1):
        alt_outbound = dict(n["outbound"])
        alt_outbound["tag"] = f"node-{i}-{n['remarks']}"
        outbounds.append(alt_outbound)

    config = {
        "log": {
            "loglevel": "warning"
        },
        "inbounds": [
            {
                "tag": "http-in",
                "port": 10809,
                "listen": "0.0.0.0",
                "protocol": "http",
                "settings": {
                    "timeout": 60,
                    "allowTransparent": False
                }
            },
            {
                "tag": "socks-in",
                "port": 10808,
                "listen": "0.0.0.0",
                "protocol": "socks",
                "settings": {
                    "auth": "noauth",
                    "udp": True
                }
            }
        ],
        "outbounds": outbounds,
        "routing": {
            "domainStrategy": "IPIfNonMatch",
            "rules": [
                {
                    "type": "field",
                    "ip": [
                        "geoip:private"
                    ],
                    "outboundTag": "direct"
                },
                {
                    "type": "field",
                    "network": "tcp,udp",
                    "outboundTag": "proxy"
                }
            ]
        }
    }

    return config, best_node


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Update Xray config from V2Ray subscription URL.")
    parser.add_argument("--sub-url", help="V2Ray subscription URL (defaults to V2RAY_SUB_URL from .env)")
    parser.add_argument("--output", help="Output config path (defaults to proxy/config.json)")
    parser.add_argument("--test", action="store_true", help="Test proxy connection if proxy container is running")
    args = parser.parse_args()

    sub_url = args.sub_url or load_env_var("V2RAY_SUB_URL")
    if not sub_url:
        print("ERROR: V2RAY_SUB_URL is not provided via CLI or found in .env files.", file=sys.stderr)
        print("Please add V2RAY_SUB_URL=https://... to your .env file.", file=sys.stderr)
        sys.exit(1)

    print(f"Fetching subscription from: {sub_url[:35]}... (redacted)")
    try:
        sub_content = fetch_subscription(sub_url)
    except Exception as e:
        print(f"ERROR: Failed to fetch subscription: {e}", file=sys.stderr)
        sys.exit(1)

    nodes = []
    for line in sub_content.splitlines():
        line = line.strip()
        if not line:
            continue
        if line.startswith("vless://"):
            node = parse_vless_url(line)
            if node:
                nodes.append(node)

    if not nodes:
        print("ERROR: No valid VLESS nodes found in the provided subscription.", file=sys.stderr)
        sys.exit(1)

    print(f"Successfully parsed {len(nodes)} node(s).")
    config, best_node = generate_xray_config(nodes)
    print(f"Selected primary node: {best_node['remarks']} ({best_node['net_type']}+{best_node['security']} via {best_node['address']}:{best_node['port']})")

    base_dir = Path(__file__).resolve().parent.parent
    output_path = Path(args.output) if args.output else (base_dir / "proxy" / "config.json")
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)

    print(f"✔ Successfully saved Xray configuration to: {output_path}")

    if args.test:
        proxy_url = "http://127.0.0.1:10809"
        print(f"Testing connectivity through {proxy_url} to Twitch OAuth...")
        try:
            proxy_handler = urllib.request.ProxyHandler({"http": proxy_url, "https": proxy_url})
            opener = urllib.request.build_opener(proxy_handler)
            req = urllib.request.Request("https://id.twitch.tv/oauth2/token", headers={"User-Agent": "Mozilla/5.0"})
            with opener.open(req, timeout=10) as resp:
                print(f"✔ Connection successful! HTTP {resp.status}")
        except urllib.error.HTTPError as e:
            # 400 or 404 from Twitch means the connection successfully reached Twitch servers
            print(f"✔ Connection successful! Reached Twitch server (HTTP {e.code})")
        except Exception as e:
            print(f"✖ Test failed: {e}", file=sys.stderr)
            print("Note: Ensure the 'proxy' container is running: docker compose -f docker-compose.prod.yml up -d proxy", file=sys.stderr)


if __name__ == "__main__":
    main()
