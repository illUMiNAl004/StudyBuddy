import json
from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup

def fetch_si_sessions():
    url = "https://www.umass.edu/lrc/si-sessions-schedule"
    
    with sync_playwright() as p:
        # Launch a headless browser
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        print("Navigating to UMass LRC...")
        page.goto(url, wait_until="networkidle")
        
        # Wait specifically for a table to appear (timeout after 10 seconds)
        try:
            page.wait_for_selector("table", timeout=10000)
            html = page.content()
        except:
            print("Timed out waiting for the table to load.")
            browser.close()
            return None
        
        browser.close()

    # Now use BeautifulSoup on the fully rendered HTML
    soup = BeautifulSoup(html, 'html.parser')
# Find ALL tables on the page
    tables = soup.find_all('table')
    sessions = []
    
    print(f"Found {len(tables)} tables on the page. Processing...")

    for table in tables:
        # Get headers for this specific table
        headers = [th.get_text(strip=True) for th in table.find_all('th')]
        
        # If no <th>, try to use the first row as header
        rows = table.find_all('tr')
        if not headers and rows:
            headers = [td.get_text(strip=True) for td in rows[0].find_all('td')]
            rows = rows[1:] # Skip the first row since we used it for headers
        else:
            rows = rows[1:]

        for row in rows:
            cells = row.find_all(['td', 'th'])
            if not cells or len(cells) < 2:
                continue
            
            course_name = cells[0].get_text(strip=True)
            # Ignore placeholder or empty rows
            if not course_name or course_name.lower() == "course":
                continue

            row_data = {"course": course_name}
            for i in range(1, len(cells)):
                # Ensure we don't go out of bounds if rows/headers don't match
                day_label = headers[i] if i < len(headers) else f"Col_{i}"
                cell_text = " ".join(cells[i].get_text(separator=" ").split())
                row_data[day_label] = cell_text if cell_text else "No Session"
            
            sessions.append(row_data)
            
    return sessions

if __name__ == "__main__":
    data = fetch_si_sessions()
    if data:
        with open('si_sessions.json', 'w') as f:
            json.dump(data, f, indent=4)
        print(f"Success! Extracted {len(data)} courses to si_sessions.json")
    else:
        print("Failed to extract data.")