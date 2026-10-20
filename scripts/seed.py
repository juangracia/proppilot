#!/usr/bin/env python3
"""Seeds a local PropPilot backend (profile `local`) with Argentine demo data.

Usage: scripts/seed.py [--reset] [--api http://localhost:8080/api] [--db proppilot] [--container proppilot-postgres]

--reset truncates all domain tables through `docker exec <container> psql` first.
--container picks the Postgres container (a parallel worktree uses proppilot-pg-wt<N>).
Index values (ICL/IPC) are synthetic, tagged source='seed-synthetic'; they are not BCRA/INDEC data.
"""
import argparse
import json
import subprocess
import sys
import urllib.error
import urllib.request
from datetime import date, timedelta

PROPERTIES = [
    ("Av. Santa Fe 2450, Piso 3 A, CABA", "Departamento", 450000),
    ("Gorriti 4870, PB, Palermo, CABA", "PH", 520000),
    ("Av. Rivadavia 6120, Piso 7 B, Caballito, CABA", "Departamento", 380000),
    ("Calle 12 1350, La Plata, Buenos Aires", "Casa", 610000),
    ("Bv. Oroño 845, Piso 2, Rosario, Santa Fe", "Departamento", 330000),
    ("Av. Colón 1220, Local 4, Córdoba", "Local", 700000),
    ("Thames 1580, Piso 1 C, Villa Crespo, CABA", "Departamento", 410000),
    ("Av. del Libertador 5400, Cochera 12, CABA", "Cochera", 90000),
]

TENANTS = [
    ("María Fernández", "27345678", "maria.fernandez@example.com", "+54 11 4567-1234"),
    ("Juan Pérez", "30123456", "juan.perez@example.com", "+54 11 5555-2233"),
    ("Lucía Gómez", "33987654", "lucia.gomez@example.com", "+54 221 444-9087"),
    ("Martín Rodríguez", "28765432", "martin.rodriguez@example.com", "+54 341 567-3321"),
    ("Sofía López", "35111222", "sofia.lopez@example.com", "+54 351 678-4411"),
    ("Diego Martínez", "20-29876543-7", "diego.martinez@example.com", "+54 11 6789-0012"),
    ("Valentina Díaz", "38222333", "valentina.diaz@example.com", "+54 11 3456-7788"),
    ("Kiosco El Sol SRL", "30-71234567-9", "admin@kioscoelsol.example.com", "+54 351 222-1100"),
]

def lease_specs(today):
    """Leases with dates relative to today, so the demo always shows the same cases.

    Each spec: property idx, tenant idxs, start, months, rent, index, frequency, terminate,
    months since the last full rent payment (0 = paid this month), partial payment this month.
    No lease past its end date while still ACTIVE: the dashboard counts it as active but /leases/active does not,
    which breaks the smoke test (add that case in the branch that handles it).
    """
    soon = today + timedelta(days=45)
    next_adjust = today + timedelta(days=12)
    return [
        # up to date, ICL yearly adjustment (the e2e specs look for this lease)
        (0, [0], date(2025, 3, 1), 36, 450000, "ICL", 12, False, 0, False),
        # paid this month only half
        (1, [1, 6], date(2024, 11, 1), 36, 480000, "ICL", 12, False, 1, True),
        # IPC every 3 months, next adjustment in 12 days, owes this month
        (2, [2], add_months(next_adjust, -15), 24, 380000, "IPC", 3, False, 1, False),
        # owes the last two months
        (3, [3], date(2025, 1, 15), 36, 600000, "ICL", 12, False, 2, False),
        # up to date, ends in 45 days
        (5, [7], add_months(soon, -36), 36, 650000, "IPC", 6, False, 0, False),
        # terminated lease, no alerts
        (4, [4], date(2024, 9, 1), 24, 300000, "ICL", 12, True, 0, False),
    ]


TABLES = "payments, lease_tenants, leases, tenants, property_units, index_values"


def api(base, method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(base + path, data=data, method=method,
                                 headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        sys.exit(f"{method} {path} failed: {e.code} {e.read().decode()[:300]}")


def psql(sql, db="proppilot", container="proppilot-postgres"):
    subprocess.run(["docker", "exec", "-i", container, "psql", "-q", "-v", "ON_ERROR_STOP=1",
                    "-U", "proppilot", "-d", db], input=sql.encode(), check=True)


def month_iter(start, end):
    y, m = start.year, start.month
    while (y, m) <= (end.year, end.month):
        yield date(y, m, 1)
        y, m = (y + 1, 1) if m == 12 else (y, m + 1)


def add_months(d, n):
    y, m = divmod(d.month - 1 + n, 12)
    return date(d.year + y, m + 1, min(d.day, 28))


def index_values_sql(today):
    rows = []
    for index_type, base, monthly in (("ICL", 10.0, 0.025), ("IPC", 5000.0, 0.022)):
        value = base
        for d in month_iter(date(2023, 1, 1), today):
            rows.append(f"('AR', '{index_type}', {value:.6f}, '{d}', 'seed-synthetic', now())")
            value *= 1 + monthly
    return ("INSERT INTO index_values (country_code, index_type, value, value_date, source, created_at) VALUES\n"
            + ",\n".join(rows) + ";")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--reset", action="store_true")
    parser.add_argument("--api", default="http://localhost:8080/api")
    parser.add_argument("--db", default="proppilot")
    parser.add_argument("--container", default="proppilot-postgres")
    args = parser.parse_args()
    today = date.today()

    if args.reset:
        psql(f"TRUNCATE {TABLES} RESTART IDENTITY CASCADE;", args.db, args.container)
    elif api(args.api, "GET", "/property-units"):
        sys.exit("Database already has data. Run with --reset to start over.")

    psql(index_values_sql(today), args.db, args.container)

    units = [api(args.api, "POST", "/property-units",
                 {"address": a, "type": t, "baseRentAmount": r}) for a, t, r in PROPERTIES]
    tenants = [api(args.api, "POST", "/tenants",
                   {"fullName": n, "nationalId": i, "email": e, "phone": p}) for n, i, e, p in TENANTS]

    payments = 0
    specs = lease_specs(today)
    for unit_idx, tenant_idxs, start, months, rent, index, freq, terminate, behind, partial in specs:
        lease = api(args.api, "POST", "/leases", {
            "propertyUnitId": units[unit_idx]["id"],
            "tenantIds": [tenants[i]["id"] for i in tenant_idxs],
            "startDate": str(start),
            "endDate": str(add_months(start, months)),
            "monthlyRent": rent,
            "adjustmentIndex": index,
            "adjustmentFrequencyMonths": freq,
            "countryCode": "AR",
        })
        last_paid = add_months(today, -behind) if not terminate else add_months(start, 10)
        api(args.api, "POST", "/payments", {"leaseId": lease["id"], "amount": rent, "paymentDate": str(start),
                                            "paymentType": "DEPOSIT", "description": "Depósito de garantía"})
        payments += 1
        for d in month_iter(start, last_paid):
            pay_date = date(d.year, d.month, min(start.day, 10))
            if pay_date < start or pay_date > today:
                continue
            api(args.api, "POST", "/payments", {"leaseId": lease["id"], "amount": rent,
                                                "paymentDate": str(pay_date), "paymentType": "RENT",
                                                "description": f"Alquiler {d:%m/%Y}"})
            payments += 1
        if partial:
            api(args.api, "POST", "/payments", {"leaseId": lease["id"], "amount": rent // 2,
                                                "paymentDate": str(today), "paymentType": "RENT",
                                                "description": f"Alquiler {today:%m/%Y} (parcial)"})
            payments += 1
        if terminate:
            api(args.api, "POST", f"/leases/{lease['id']}/terminate")

    print(f"Seeded {len(units)} properties, {len(tenants)} tenants, {len(specs)} leases, "
          f"{payments} payments and ICL/IPC index values up to {today:%Y-%m}.")


if __name__ == "__main__":
    main()
