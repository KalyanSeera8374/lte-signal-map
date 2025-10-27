#!/usr/bin/env python3
"""
LTE device data simulator for the Los Angeles area.

This script emits synthetic LTE signal samples that match the structure:
{
  "timestamp": "2025-10-27T18:45:12Z",
  "device_name": ["tick-5G", "tick-4G", "tick-GPS"],
  "gps_location": {"latitude": 47.234, "longitude": -122.343},
  "mac_addr": "a0:b1:c2:xx:xx:xx",
  "lte_signal_strength": -89.23
}

By default it generates 100 device entries for the current 5‑minute window with
most devices located in the city core. Use --snapshots to create multiple
5‑minute windows in one run and --output to persist the generated JSON.
"""

from __future__ import annotations

import argparse
import json
import math
import random
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Iterable, List, Sequence

# Geographic configuration (Los Angeles downtown as the city center).
CITY_CENTER_LAT = 34.0522
CITY_CENTER_LON = -118.2437
CITY_RADIUS_KM = 20.0
OUTER_RADIUS_KM = (20.0, 60.0)
DEVICES_PER_WINDOW = 100
CITY_RATIO = 0.8  # 80% of the devices stay within the city radius.

# Conversion helpers.
KM_PER_DEG_LAT = 110.574
KM_PER_DEG_LON_AT_EQ = 111.320

# Device naming helpers.
DEVICE_NAME_POOL = ["tick-5G", "tick-4G", "tick-GPS"]


@dataclass(frozen=True)
class Device:
    """Static attributes for a simulated device."""

    name: str
    mac_addr: str
    gps_location: dict
    in_city: bool


@dataclass(frozen=True)
class SimulationConfig:
    """Runtime knobs for the simulator."""

    seed: int | None
    snapshots: int
    indent: int | None
    output: Path | None


def parse_args() -> SimulationConfig:
    parser = argparse.ArgumentParser(
        description="Generate LTE device readings for the Los Angeles region."
    )
    parser.add_argument(
        "--snapshots",
        type=int,
        default=1,
        help="Number of 5-minute windows to generate (default: 1).",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=None,
        help="Optional random seed to reproduce identical samples.",
    )
    parser.add_argument(
        "--indent",
        type=int,
        default=2,
        help="Pretty-print JSON with the provided indent width (default: 2).",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Optional file path. When provided the JSON is written to this file.",
    )
    args = parser.parse_args()
    return SimulationConfig(
        seed=args.seed,
        snapshots=max(1, args.snapshots),
        indent=args.indent,
        output=args.output,
    )


def random_device_name() -> str:
    """Pick a single label from the allowed pool."""
    return random.choice(DEVICE_NAME_POOL)


def random_mac_address() -> str:
    """Generate a MAC address starting with the desired OUI."""
    prefix = ["a0", "b1", "c2"]
    remainder = [f"{random.randint(0, 255):02x}" for _ in range(3)]
    return ":".join(prefix + remainder)


def random_signal_strength(in_city: bool) -> float:
    """Sample LTE signal strength with distributions per zone."""
    mean = -80 if in_city else -95
    std_dev = 5 if in_city else 7
    strength = random.gauss(mean, std_dev)
    # Bound to realistic RSSI range.
    return round(min(-50, max(-120, strength)), 2)


def random_location(in_city: bool) -> dict:
    """Return a random lat/lon dict for either city or outer region."""
    angle = random.uniform(0, 2 * math.pi)
    if in_city:
        # Square root keeps samples uniform over the circle area.
        radius_km = math.sqrt(random.random()) * CITY_RADIUS_KM
    else:
        radius_km = random.uniform(*OUTER_RADIUS_KM)
    offset_x = radius_km * math.cos(angle)
    offset_y = radius_km * math.sin(angle)

    km_per_deg_lon = KM_PER_DEG_LON_AT_EQ * math.cos(math.radians(CITY_CENTER_LAT))
    delta_lat = offset_y / KM_PER_DEG_LAT
    delta_lon = offset_x / km_per_deg_lon

    latitude = round(CITY_CENTER_LAT + delta_lat, 6)
    longitude = round(CITY_CENTER_LON + delta_lon, 6)
    return {"latitude": latitude, "longitude": longitude}


def create_devices() -> List[Device]:
    """Initialize the 100 simulated devices with fixed locations."""
    city_count = int(DEVICES_PER_WINDOW * CITY_RATIO)
    outer_count = DEVICES_PER_WINDOW - city_count
    devices: List[Device] = []

    for idx in range(city_count):
        devices.append(
            Device(
                name=random_device_name(),
                mac_addr=random_mac_address(),
                gps_location=random_location(True),
                in_city=True,
            )
        )
    for idx in range(outer_count):
        devices.append(
            Device(
                name=random_device_name(),
                mac_addr=random_mac_address(),
                gps_location=random_location(False),
                in_city=False,
            )
        )
    return devices


def iso_timestamp(dt: datetime) -> str:
    return dt.replace(microsecond=0, tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")


def generate_device_entry(timestamp: datetime, device: Device) -> dict:
    """Produce a single device document."""
    return {
        "timestamp": iso_timestamp(timestamp),
        "device_name": device.name,
        "gps_location": device.gps_location,
        "mac_addr": device.mac_addr,
        "lte_signal_strength": random_signal_strength(device.in_city),
    }


def generate_snapshot(timestamp: datetime, devices: Sequence[Device]) -> List[dict]:
    """Generate readings for every device for a single 5-minute window."""
    return [generate_device_entry(timestamp, device) for device in devices]


def generate_windows(start_time: datetime, snapshots: int, devices: Sequence[Device]) -> List[dict]:
    """Flatten multiple 5-minute snapshots into a single list."""
    data: List[dict] = []
    for idx in range(snapshots):
        window_time = start_time + timedelta(minutes=5 * idx)
        data.extend(generate_snapshot(window_time, devices))
    return data


def emit_json(payload: Sequence[dict], indent: int | None, output_path: Path | None) -> None:
    serialized = json.dumps(payload, indent=indent)
    if output_path:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(serialized + "\n", encoding="utf-8")
    else:
        print(serialized)


def main() -> None:
    config = parse_args()
    if config.seed is not None:
        random.seed(config.seed)
    devices = create_devices()
    start_time = datetime.now(timezone.utc)
    dataset = generate_windows(start_time, config.snapshots, devices)
    emit_json(dataset, config.indent, config.output)


if __name__ == "__main__":
    main()
