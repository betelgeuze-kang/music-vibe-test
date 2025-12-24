
import sys

filename = 'index.html'

try:
    with open(filename, 'rb') as f:
        content = f.read()
        
    if b'\x00' in content:
        print(f"CRITICAL: Found {content.count(b'00')} NUL bytes in {filename}!")
        # Optional: Print location of first NUL
        print(f"First NUL at index: {content.find(b'00')}")
    else:
        print(f"Clean: No NUL bytes found in {filename}.")
        
    # Check for other binary-ish control chars (ignoring CR LF TAB)
    control_chars = [i for i in content if i < 32 and i not in (9, 10, 13)]
    if control_chars:
        print(f"Found {len(control_chars)} other suspicious control characters.")

except Exception as e:
    print(f"Error: {e}")
