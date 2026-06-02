import base64
import json
import subprocess
import sys

if len(sys.argv) >= 2:
    if sys.argv[1].endswith(".pdf"):
        source_type = "pdf"
        with open(sys.argv[1], "rb") as f:
            content = base64.b64encode(f.read()).decode()
    elif sys.argv[1].endswith((".xlsx", "lsx")):
        source_type = "excel"
        with open(sys.argv[1], "rb") as f:
            content = base64.b64encode(f.read()).decode()
    else:
        content = sys.argv[1]
        source_type: str = "email"

    input_data = json.dumps({
        "vendor": "Acme Corp",
        "project": "ERP Migration",
        "source_type": source_type,
        "content": content,
        "analyst": "John Doe"
    })
    subprocess.run(["make", "execute", "workflow=tpra-evaluation",
                    f"input={input_data}"])
else:
    print("Path of the file not found")
    sys.exit(1)
