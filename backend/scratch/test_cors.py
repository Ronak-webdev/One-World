import requests

try:
    # Test pre-flight OPTIONS
    print("Testing OPTIONS /api/audio/enhance...")
    resp = requests.options("http://localhost:8000/api/audio/enhance", headers={
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "POST"
    })
    print(f"Status: {resp.status_code}")
    print("Headers:")
    for k, v in resp.headers.items():
        if "access-control" in k.lower():
            print(f"  {k}: {v}")

    # Test POST
    print("\nTesting POST /api/audio/enhance...")
    resp = requests.post("http://localhost:8000/api/audio/enhance", headers={
        "Origin": "http://localhost:3000"
    })
    print(f"Status: {resp.status_code}")
    print("Headers:")
    for k, v in resp.headers.items():
        if "access-control" in k.lower():
            print(f"  {k}: {v}")
except Exception as e:
    print(f"Error: {e}")
