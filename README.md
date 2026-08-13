# Attendance Tracker — GitHub Pages

A static HTML/CSS/JavaScript attendance tracker based on the uploaded Excel reference.

## Included
- Employee master: Emp ID, Name, Designation
- Monthly attendance grid with Month + Year dropdowns
- Status dropdown: OP, HP, PL, SL, UL, CP, CO, GP, LM, WFH, NH, FL, WL
- MTD and YTD summaries for calendar year (01 Jan–31 Dec)
- Weekend, National Holiday and Festival Holiday counts
- Present Equivalent calculation: OP/CP/GP/WFH/LM/CO = 1 day; HP = 0.5 day
- Holiday manager
- Employee master editor
- Export/import JSON backup
- Supports 2026–2030
- Responsive/mobile-friendly

## Important: current storage model
This version stores data in browser `localStorage`. That means the data persists on the same browser/device but is **not shared between multiple devices or users**.

For a shared company URL, connect the UI to Supabase/Firebase (or another backend). The UI is already separated cleanly so this can be added as the next step.

## Deploy on GitHub Pages
1. Create a GitHub repository, e.g. `attendance-tracker`.
2. Upload `index.html`, `style.css`, and `app.js`.
3. GitHub → Settings → Pages → Deploy from branch → `main` → `/root`.
4. Open the generated `https://<username>.github.io/attendance-tracker/` URL.

## Usage
1. Open Attendance tab.
2. Select Month and Year.
3. Enter status for each employee/day.
4. Use "Fill weekends as WL" if weekends should be recorded automatically.
5. Add NH/FL dates in Holidays.
6. View MTD/YTD Summary.
7. Export a JSON backup regularly.
