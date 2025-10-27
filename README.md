# lte-signal-map

## Project themes

- **Device simulator**: Minimum of 2 devices for testing, up to 100 for production-sized runs. Devices emit payloads every ~5 seconds during testing and every 5–10 minutes in production.
- **Payload contract**: Each sample captures a UTC ISO 8601 timestamp, MAC-based device ID (filtered by the `a0:b1:c2` OUI), device name (`tick-5G`, `tick-4G`, or `tick-GPS`), latitude/longitude floats, and LTE signal strength (dBm). The simulator bundles these fields into the JSON structure shown below.
- **Signal strength legend**: Excellent `>= -80 dBm`, Good `-80 to -90 dBm`, Fair `-90 to -100 dBm`, Poor `-100 to -110 dBm`, Very Poor `<= -110 dBm`.
- **Data retention**: Target footprint is ~64 MB/day for 1,000 devices (220 B/sample, 12 samples/hour). Production scope covers 100 devices with a rolling 6‑month history (~12 GB). MongoDB is the preferred store for six-month retention; HiveMQTT was deemed too costly for the expected loads.
- **Frontend scope**: Map focuses on Los Angeles (≈200-mile canvas) and draws 20–50 m circles scaled to zoom level. Users can filter by device name, pick time intervals (10-minute granularity, start/end, or last-week slider), and auto-fit to the visible region. UI displays only the latest readings returned by the backend API.
- **API handshake**: Planned GET accepts `device_name`, central `location`, and `radius`, returning an array of the canonical JSON payloads to render on the map.

### Sample payload

```json
{
  "timestamp": "2025-10-27T18:45:12Z",
  "device_name": ["tick-5G", "tick-4G", "tick-GPS"],
  "gps_location": {"latitude": 47.234, "longitude": -122.343},
  "mac_addr": "a0:b1:c2:xx:xx:xx",
  "lte_signal_strength": -89.23
}
```

## LTE signal simulator

Synthetic LTE snapshots are produced by the simulator located at `scripts/data_simulator.py`. The script emits timestamped device readings for the Los Angeles region and can be configured via CLI flags (seed, snapshot count, JSON indentation, and output path).

### Reproducing the dataset

The committed `data.json` file was generated with:

```bash
python3 lte-signal-map/simulator.py --seed 42 --snapshots 20 --output data.json
```

Run the command from the parent directory so that the output path resolves to `<repo-root>/data.json`. Adjust the `--seed` or `--snapshots` arguments to explore different deterministic datasets.
