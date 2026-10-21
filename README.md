# Cycle Tracker – a friendly period companion

Hi there 👋  
I’m just a random guy who built this for a friend (with a little help from AI).  
It’s **not medical advice**, and bodies are beautifully unpredictable – but this tool can help you spot patterns and make better predictions over time.

## ⚠️ Important – please read

- **This is not a doctor.** The human body is weird, cycles change, and predictions can be wrong – especially when you first start using it.
- **The more cycles you log, the smarter it gets.** It learns from your data, so don't expect miracles on day one.
- **Your data stays on your device** (local storage). That means:
  - ✅ It won't magically disappear when you close the tab.
  - ❌ It **will** vanish if you clear your browser's history, cookies, or site data.
  - ❌ It does **not** sync across devices automatically.

## 📅 How to use it

### 1. Track your period

**The easiest way now:** Use the **Calendar** view inside this app – tap days to log your period directly. No extra tools needed.

*But if you prefer to track outside first (old habits die hard), you can use anything – Google Sheets, a notebook, a calendar. I used to mark each bleeding day with a `1` in Google Sheets, but now I just use the app's calendar. Either way, once your period is **completely over**, enter the **start date** and **end date** into the tracker.*

### 2. Log a cycle inside the app
- Go to the **Dashboard**.
- Pick the **start date** (required) and **end date** (optional – if you leave it empty, the period stays "active").
- Click **Add / update cycle**.

The more cycles you enter, the better your **next period prediction** becomes.

### 3. Use the calendar to adjust or fix mistakes
- Switch to the **Calendar** view.
- Tap any date to:
  - **Start a new period** (if none is active)
  - **Extend or shorten** an ongoing period
  - **End a period** (tap the last tracked day)
  - **Reactivate** an ended period (tap its end date)
  - **Delete** a whole period (tap its start date)

> 📱 The calendar works on both desktop and mobile – just resize your browser or use your phone.

## 💾 How to keep your data safe (important!)

Because everything is stored in your browser's **local storage**, your cycles will be lost if you:
- Clear your browsing history / cookies / site data
- Use a different browser or device
- Open the app in incognito/private mode

### ✅ Two ways to back up and restore

#### For everyone (easy)
- Click **📎 Export** → saves a `.json` file to your computer.
- To restore, click **📂 Import** and select that file.

#### For tech‑savvy people (raw JSON)
- Click the **🖥️** button (developer tools) → edit the JSON directly.
- Copy the whole array and save it somewhere safe.
- Paste it back later and click **💾 Save**.

> 💡 **Pro tip:** After logging a few cycles, export a backup and keep it on your phone or computer. Then you'll never lose your history.

## 🔮 Predictions & accuracy

- The app calculates your **average cycle length** and **average period length** from your logged cycles.
- It then guesses when your next period will start and end.
- **It can be wrong** – stress, illness, travel, or just your body being itself can change everything.
- Add more cycles → better averages → better guesses.

## 🧑‍💻 Credits & disclaimer

- Built by a non‑expert human + AI, reviewed by female friends for accuracy.
- **Not medical advice.** If something feels off, please talk to a real healthcare provider.
- The code is open for anyone to use, but I don't guarantee anything.

## 🌐 Links

- Cloudflare Pages: [https://perioddtracker.pages.dev/](https://perioddtracker.pages.dev/)
- GitHub mirror: [https://el3ctricfx.github.io/Period-Tracker/](https://el3ctricfx.github.io/Period-Tracker/)

---

Happy tracking, and be kind to your body – it's doing its best 💪🌙