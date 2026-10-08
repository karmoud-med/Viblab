from bs4 import BeautifulSoup
import re

with open('cours/Analyse_Vibratoire_Slides_Niveau_2.html', 'r', encoding='utf-8') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')

slides = []
slide_id = 1

# Find all doc-page sections
pages = soup.find_all('section', class_='doc-page')

for page in pages:
    h2 = page.find('h2')
    if not h2:
        continue
    
    title = h2.get_text(separator=' ', strip=True)
    if "Sommaire" in title:
        continue
        
    # Get all paragraphs, lists, tables
    content_html = ""
    # We will gather all tags after the h2
    for sibling in h2.find_next_siblings():
        if sibling.name in ['p', 'ul', 'ol', 'sc-raw-table', 'figure', 'div']:
            # Skip empty divs or purely structural ones if possible, but let's just keep the inner text for simplicity or basic HTML
            if sibling.name == 'div' and not sibling.text.strip():
                continue
            
            # Clean up styles
            for tag in sibling.find_all(True):
                tag.attrs = {}
            sibling.attrs = {}
            content_html += str(sibling)
            
    # Clean up some specific tags
    content_html = content_html.replace('sc-raw-table', 'table').replace('sc-raw-tbody', 'tbody').replace('sc-raw-tr', 'tr').replace('sc-raw-th', 'th').replace('sc-raw-td', 'td')
    
    # Simple heuristic to extract a subtitle from the first paragraph
    subtitle = ""
    first_p = page.find('p')
    if first_p:
        subtitle = first_p.get_text(strip=True)[:100] + "..." if len(first_p.get_text(strip=True)) > 100 else first_p.get_text(strip=True)
    
    # Escape quotes and formatting for TSX
    content_escaped = content_html.replace('`', '\\`').replace('$', '\\$')
    
    # Sometimes content is too long, we might just wrap it in a div
    tsx_content = f"`{content_escaped}`"
    
    slide = f"""  {{ 
    id: {slide_id}, 
    title: "{title.replace('"', '\\"')}", 
    subtitle: "{subtitle.replace('"', '\\"')}", 
    content: <div className="course-content prose prose-sm max-w-none text-slate-700 dark:text-slate-300" dangerouslySetInnerHTML={{{{ __html: {tsx_content} }}}} />, 
    trainerNotes: "Explications pour : {title.replace('"', '\\"')}" 
  }},"""
    slides.append(slide)
    slide_id += 1

out_str = "const slidesAnalyse2: Slide[] = [\n" + "\n".join(slides) + "\n];\n"

with open('scratch_react_slides.tsx', 'w', encoding='utf-8') as f:
    f.write(out_str)

print(f"Generated {len(slides)} slides.")
