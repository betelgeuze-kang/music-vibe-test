
import re

def validate_file(path):
    print(f"Reading file: {path}")
    try:
        with open(path, 'rb') as f:
            raw_content = f.read()
            if b'\x00' in raw_content:
                 print("CRITICAL ERROR: File contains NULL bytes (binary corruption)!")
            try:
                content = raw_content.decode('utf-8')
            except UnicodeDecodeError:
                print("CRITICAL ERROR: File is not valid UTF-8!")
                return
    except Exception as e:
        print(f"Error reading file: {e}")
        return

    print(f"File size: {len(content)} bytes")

    # Check for basic tags
    tags_to_check = ['html', 'head', 'body', 'style', 'script', 'div']
    
    for tag in tags_to_check:
        open_tag = f"<{tag}"
        close_tag = f"</{tag}>"
        
        count_open = len(re.findall(open_tag, content, re.IGNORECASE))
        count_close = len(re.findall(close_tag, content, re.IGNORECASE))
        
        print(f"Tag <{tag}>: Open={count_open}, Close={count_close}")
        if count_open != count_close and tag not in ['div']: # div mismatch is common/harder to parse strictly with regex
             print(f"WARNING: Mismatch in {tag} tags!")

    # Check for duplicate const definitions
    consts = ['TRANSLATIONS', 'RESULTS_DATA', 'QUESTIONS']
    for const_name in consts:
        pattern = f"const {const_name} ="
        matches = len(re.findall(pattern, content))
        print(f"const {const_name}: {matches} definitions")
        if matches > 1:
            print(f"ERROR: Multiple definitions of {const_name}!")
        if matches == 0:
             print(f"ERROR: Missing definition of {const_name}!")

    # Check for unclosed comments
    # CSS comments
    css_comments_open = content.count("/*")
    css_comments_close = content.count("*/")
    print(f"CSS Comments: Open={css_comments_open}, Close={css_comments_close}")
    
    # HTML comments
    html_comments_open = content.count("<!--")
    html_comments_close = content.count("-->")
    print(f"HTML Comments: Open={html_comments_open}, Close={html_comments_close}")

    # Check specific critical sections
    if "<!DOCTYPE html>" not in content:
        print("WARNING: Missing <!DOCTYPE html>")

validate_file(r"c:\Users\j5938\.gemini\antigravity\scratch\music_vibe_test\index.html")
