import os
import re

def check_duplicate_keys(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Very simple regex to find object literals and check for duplicate keys
    # This won't be perfect but it's a good sanity check
    # Looking for: { ... key: ... key: ... }
    # Focusing on 'status' key
    
    # Find all { ... } blocks
    blocks = re.findall(r'\{([^{}]+)\}', content)
    for block in blocks:
        keys = re.findall(r'(\w+)\s*:', block)
        seen = set()
        for k in keys:
            if k == 'status' and k in seen:
                print(f"DUPLICATE KEY '{k}' found in {file_path}")
                # Print the block for context
                print("Block context:", block[:100], "...")
            seen.add(k)

root_dir = r"d:\PROJECTS\DBMS-sfms\frontend\src"
for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith('.jsx'):
            check_duplicate_keys(os.path.join(root, file))
