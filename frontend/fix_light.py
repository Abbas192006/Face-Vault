import re

files = ['src/LandingPage.tsx', 'src/App.tsx']

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace border-white/* with border-outline/20
    content = re.sub(r'border-white/\d+', 'border-outline/20', content)
    # Replace bg-white/* with bg-on-surface/5
    content = re.sub(r'bg-white/\d+', 'bg-on-surface/5', content)
    # Replace text-white with text-on-surface
    content = re.sub(r'\btext-white\b', 'text-on-surface', content)

    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
