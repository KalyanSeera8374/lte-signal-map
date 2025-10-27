# lte-signal-map

## LTE signal simulator

Synthetic LTE snapshots are produced by the simulator located at `scripts/data_simulator.py`. The script emits timestamped device readings for the Los Angeles region and can be configured via CLI flags (seed, snapshot count, JSON indentation, and output path).

### Reproducing the dataset

The committed `data.json` file was generated with:

```bash
python3 lte-signal-map/simulator.py --seed 42 --snapshots 20 --output data.json
```

Run the command from the parent directory so that the output path resolves to `<repo-root>/data.json`. Adjust the `--seed` or `--snapshots` arguments to explore different deterministic datasets.
