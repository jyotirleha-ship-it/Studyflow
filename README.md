# StudyFlow — Intelligent Study Planner & Personal Learning Mentor

Full-stack Intelligent Study Planner, Manager & Personal Learning Mentor web application.

---

## 🚀 How to Open and Run in VS Code

### 1. Open Project in VS Code
1. Launch **Visual Studio Code**.
2. Go to **File ➔ Open Folder...** (or press `Ctrl+K Ctrl+O`).
3. Select this folder:
   ```
   C:\Users\JOTHIR LEKHA\.gemini\antigravity\scratch\studyflow
   ```

---

### 2. Verify MongoDB
Ensure MongoDB is running (it runs automatically as a Windows service on your system):
```powershell
Get-Service -Name *mongo*
```

---

### 3. Run with VS Code Terminals (Recommended)

Open two split terminals in VS Code (`Ctrl+\``):

#### Terminal 1 — Backend API (Port 5000):
```powershell
cd server
npm start
```
*(Or `npm run dev` for auto-restart mode)*

#### Terminal 2 — Frontend Client (Port 5173):
```powershell
cd client
npm run dev
```

---

### 4. Run Using VS Code Tasks (Alternative 1-Click)
1. Press `Ctrl+Shift+P` in VS Code.
2. Type **`Tasks: Run Task`** and press Enter.
3. Select **`1. Start Backend Server`**.
4. Repeat and select **`2. Start Frontend Client`**.

---

### 5. Access the Application
Open your web browser and navigate to:
👉 **`http://localhost:5173`**

#### Demo Credentials:
* **Email:** `student@studyflow.ai`
* **Password:** `password123`
* *(Or simply click the **"Log In with Demo Data (Alex)"** button on the login screen for instantaneous access!)*

---

## 🛠 Features Available
* **Learning Neural Network Background:** Interactive cursor trail and particle connections.
* **Personal Learning DNA:** Peak hours analysis (7–9 PM), session stamina, and radar chart.
* **Next Best Study Action:** Algorithmic recommendation with explainable reasons and a [Start Now] button.
* **Automatic Plan Repair:** Rebalances missed tasks into upcoming slots with user approval.
* **What-If Skip Simulator:** Projected effects of skipping today's study on readiness and workload.
* **Fake Understanding Detector:** Adaptive post-session quiz catching surface recall vs. application problems.
* **Floating AI Mentor:** Proactive chatbot proposing tasks with [Accept Task], [Modify], and [Reject].
* **Full Calendar & Planner:** Month, Week, and Day views with drag-and-drop rescheduling.
* **Internationalization (i18n):** Complete app-wide support for English, Tamil (தமிழ்), and Hindi (हिंदी).
* **PDF Study Summaries:** Instant PDF export via PDFKit, Markdown (.md), and Text (.txt).
