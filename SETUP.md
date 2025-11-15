# How to Set Up TOCSEA

Quick guide to get TOCSEA running on your computer.

---

## What You Need

- Python 3.7 or higher
- Internet connection

**Check Python:** Open terminal/command prompt and type `python --version` (or `python3 --version` on Mac/Linux)

---

## Step 1: Open Project Folder

Open terminal/command prompt and go to your project folder:

**Windows:**
```
cd C:\projects\tocsea
```

**Mac/Linux:**
```
cd ~/Desktop/tocsea
```

---

## Step 2: Create Virtual Environment

**Windows:**
```
python -m venv venv
```

**Mac/Linux:**
```
python3 -m venv venv
```

---

## Step 3: Activate Virtual Environment

**Windows:**
```
venv\Scripts\activate
```

**Mac/Linux:**
```
source venv/bin/activate
```

You should see `(venv)` at the start of your command line.

---

## Step 4: Install Packages

**Windows:**
```
pip install -r requirements.txt
```

**Mac/Linux:**
```
pip3 install -r requirements.txt
```

Wait for installation to finish.

---

## Step 5: Run the Server

**Windows:**
```
python app.py
```

**Mac/Linux:**
```
python3 app.py
```

You should see: `Running on http://127.0.0.1:5000`

---

## Step 6: Open in Browser

1. Open your web browser
2. Go to: `http://localhost:5000`
3. The TOCSEA website should appear!

**Keep the terminal window open** - the server needs to keep running.

That's it! You're ready to use TOCSEA! 🎉
