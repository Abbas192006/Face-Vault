import re

files = ['src/LandingPage.tsx', 'src/App.tsx']

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace indigo-glow with scanner-glow
    content = content.replace('indigo-glow', 'scanner-glow')
    # Replace border-outline/20 with border-primary/20
    content = content.replace('border-outline/20', 'border-primary/20')
    # Replace bg-on-surface/5 with bg-primary/5
    content = content.replace('bg-on-surface/5', 'bg-primary/5')

    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
