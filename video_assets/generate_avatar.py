#!/usr/bin/env python3
"""Generate Robert's avatar video from script via HeyGen."""
import os
import sys
import time
import requests
import json
from pathlib import Path

API_KEY = os.environ["HEYGEN_API_KEY"]
AVATAR_ID = os.environ.get("HEYGEN_AVATAR_ID", "145358c1167b4fada4fc5135d118e2ae")
VOICE_ID = os.environ.get("HEYGEN_VOICE_ID", "709ce43e9c4e49d0aba0d5bbc44f9356")

SCRIPT_PATH = Path(__file__).parent / "script.txt"
OUT_PATH = Path(__file__).parent / "avatar.mp4"

script = SCRIPT_PATH.read_text().strip()
print(f"Script: {len(script)} chars, ~{len(script.split())} words", flush=True)

headers = {
    "X-Api-Key": API_KEY,
    "Content-Type": "application/json",
    "Accept": "application/json",
}

payload = {
    "video_inputs": [
        {
            "character": {
                "type": "avatar",
                "avatar_id": AVATAR_ID,
                "avatar_style": "normal",
            },
            "voice": {
                "type": "text",
                "input_text": script,
                "voice_id": VOICE_ID,
            },
            "background": {"type": "color", "value": "#0e1116"},
        }
    ],
    "dimension": {"width": 1280, "height": 720},
}

print("Submitting to HeyGen...", flush=True)
r = requests.post("https://api.heygen.com/v2/video/generate", headers=headers, json=payload, timeout=60)
print(f"HTTP {r.status_code}: {r.text[:300]}", flush=True)
r.raise_for_status()
video_id = r.json()["data"]["video_id"]
print(f"video_id={video_id}", flush=True)

print("Polling status...", flush=True)
deadline = time.time() + 600
last_status = None
while time.time() < deadline:
    s = requests.get(
        f"https://api.heygen.com/v1/video_status.get?video_id={video_id}",
        headers={"X-Api-Key": API_KEY},
        timeout=30,
    )
    s.raise_for_status()
    data = s.json().get("data", {})
    status = data.get("status")
    if status != last_status:
        print(f"  status={status}", flush=True)
        last_status = status
    if status == "completed":
        url = data.get("video_url")
        print(f"completed: {url}", flush=True)
        v = requests.get(url, timeout=120)
        v.raise_for_status()
        OUT_PATH.write_bytes(v.content)
        print(f"saved: {OUT_PATH} ({len(v.content)} bytes)", flush=True)
        sys.exit(0)
    if status == "failed":
        print(f"FAILED: {data}", flush=True)
        sys.exit(1)
    time.sleep(15)

print("timeout waiting for HeyGen", flush=True)
sys.exit(2)
