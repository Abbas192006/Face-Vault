import re
import os

mapping = {
    'xl': '10',  # 40px
    'lg': '6',   # 24px
    'md': '4',   # 16px
    'sm': '2',   # 8px
    'xs': '1'    # 4px
}

files = ['src/App.tsx', 'src/LandingPage.tsx']

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    def replacer(match):
        prefix = match.group(1)
        size = match.group(2)
        return f"{prefix}-{mapping[size]}"

    # Match class names like p-xl, mb-lg, gap-md, etc.
    # We DO NOT want to match max-w-xl, rounded-xl, shadow-xl, text-xl
    pattern = r'\b(p|m|px|py|pt|pb|pl|pr|gap|top|bottom|left|right|mb|mt|ml|mr)-(xl|lg|md|sm|xs)\b'
    
    new_content = re.sub(pattern, replacer, content)

    with open(file, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"Fixed {file}")
