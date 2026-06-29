import urllib.request, json
BASE = "http://localhost:3000/api"
token = ""
def req(m, p, d=None):
    h = {"Content-Type": "application/json"}
    if token: h["Authorization"] = "Bearer " + token
    b = json.dumps(d).encode() if d else None
    try:
        resp = urllib.request.urlopen(urllib.request.Request(BASE+p, data=b, headers=h, method=m))
        return json.loads(resp.read())
    except: return None

# Login
r = req("POST", "/auth/login", {"username":"admin","password":"admin123"})
token = r.get("access_token","") if r else ""
print("  {} POST /auth/login".format("[OK]" if token else "[FAIL]"))

# CRM APIs
for name, path in [("Customers", "/crm/customers"), ("Quotes", "/crm/quotes"),
    ("Orders", "/crm/orders"), ("Complaints", "/crm/complaints")]:
    r = req("GET", path)
    print("  {} GET {}".format("[OK]" if isinstance(r, list) else "[FAIL]", path))

# Dashboard
r = req("GET", "/dashboard/stats")
print("  {} GET /dashboard/stats".format("[OK]" if isinstance(r, dict) else "[FAIL]"))

# Products
r = req("GET", "/plm/products")
print("  {} GET /plm/products".format("[OK]" if isinstance(r, list) else "[FAIL]"))
