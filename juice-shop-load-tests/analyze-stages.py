import json
import sys
import statistics

STAGES = [
    ("VU=10",  20, 45,  10),
    ("VU=25",  65, 90,  25),
    ("VU=50",  110, 135, 50),
    ("VU=75",  155, 180, 75),
    ("VU=100", 200, 225, 100),
    ("VU=150", 245, 270, 150),
]


def load_points(path):
    durations = []
    failed = []

    start_time = None

    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                continue

            if obj.get("type") != "Point":
                continue

            metric = obj.get("metric")
            data = obj.get("data", {})
            t = data.get("time")
            value = data.get("value")

            if t is None or value is None:
                continue

            from datetime import datetime
            try:
                t_clean = t.replace("Z", "")
                if "." in t_clean:
                    main, frac = t_clean.split(".")
                    frac = frac[:6]
                    t_clean = f"{main}.{frac}"
                dt = datetime.fromisoformat(t_clean)
                epoch = dt.timestamp()
            except Exception:
                continue

            if start_time is None:
                start_time = epoch

            rel = epoch - start_time

            if metric == "http_req_duration":
                durations.append((rel, value))
            elif metric == "http_req_failed":
                failed.append((rel, value))

    return durations, failed


def analyze(durations, failed):
    print(f"{'Плато':<10} {'N запитів':<12} {'Медіана (мс)':<15} {'StdDev (мс)':<15} {'% помилок':<10}")
    print("-" * 65)

    for name, start, end, target_vu in STAGES:
        vals = [v for (t, v) in durations if start <= t <= end]
        errs = [v for (t, v) in failed if start <= t <= end]

        if not vals:
            print(f"{name:<10} {'немає даних':<12}")
            continue

        median = statistics.median(vals)
        stdev = statistics.stdev(vals) if len(vals) > 1 else 0.0
        error_rate = (sum(errs) / len(errs) * 100) if errs else 0.0

        print(f"{name:<10} {len(vals):<12} {median:<15.1f} {stdev:<15.1f} {error_rate:<10.2f}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Використання: python analyze_stages.py results.json")
        sys.exit(1)

    durations, failed = load_points(sys.argv[1])
    print(f"Завантажено {len(durations)} записів http_req_duration, {len(failed)} записів http_req_failed\n")
    analyze(durations, failed)