# Emotify Deployment Guide

This guide details how to host the **Emotify Music Recommendation System** live in production (such as on **Render** or **GitHub Pages**) for your developer portfolio.

---

## ⚠️ Important Cloud Architecture Note

When running locally, the project opens your physical webcam using `cv2.VideoCapture(0)`. 

However, **cloud servers (like Render, AWS, Heroku) run in virtualized, headless datacenters and do not have webcams connected to them.** Running physical camera capture scripts on cloud servers will fail with a `Camera Error`.

### 💡 The Solution: Client-Side Capture + Server Classification

We have added a custom production endpoint `/detect_frame` in the Flask backend (`main.py`).

In production:
1. The **React Frontend** captures the webcam stream directly in the user's browser using HTML5 `navigator.mediaDevices.getUserMedia()`.
2. The browser captures a video frame snapshot, converts it to a standard **Base64** string, and sends it via an HTTP POST request to the backend's `/detect_frame` route.
3. The **Flask Backend** on Render decodes the Base64 image, processes the face detection and emotion classification algorithms, and returns the predicted mood back to the frontend.

This allows the application to work anywhere in the world on any device, fully hosted in the cloud.

---

## 1. Hosting the Backend on Render

Render is a modern cloud hosting platform perfect for hosting the Flask backend.

### Prerequisites
Make sure your Flask repository contains:
- `requirements.txt` (which has been generated in `emotionDetection/` containing production-safe `tensorflow-cpu` and `opencv-python-headless` to prevent X11 GUI dependencies crashes).
- `haarcascade_frontalface_default.xml` and `model.h5` inside the same directory.

### Deployment Steps
1. Create a free account on [Render](https://render.com/).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository containing the backend code.
4. Set the following details:
   - **Name:** `emotify-backend`
   - **Environment:** `Python 3`
   - **Root Directory:** `emotionDetection` (if in a monorepo) or leave empty if it's in its own repository.
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn main:app`
5. Click **Deploy Web Service**.
6. Note down the public URL Render gives you (e.g., `https://emotify-backend.onrender.com`).

---

## 2. Hosting the Frontend on GitHub Pages or Vercel

Since the React app is static, you can host it for free on **GitHub Pages**, **Vercel**, or **Netlify**.

### Deployment Steps (Vercel - Recommended)
Vercel is the simplest hosting platform for React applications:
1. Create an account on [Vercel](https://vercel.com/).
2. Click **Add New** > **Project** and select your React frontend repository.
3. In **Environment Variables**, add:
   - `REACT_APP_BACKEND_URL` = `https://emotify-backend.onrender.com` (Your Render backend URL).
4. Click **Deploy**.

### Deployment Steps (GitHub Pages)
1. In your React `package.json` (`frontend/package.json`), add a homepage field:
   ```json
   "homepage": "http://<username>.github.io/<repository-name>"
   ```
2. Install the GitHub Pages deploy tool:
   ```bash
   npm install --save-dev gh-pages
   ```
3. Add deployment scripts to `package.json`:
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d build"
   }
   ```
4. Update the backend URL in `App.js` to point to your live Render backend URL (`https://emotify-backend.onrender.com`).
5. Run the deployment command:
   ```bash
   npm run deploy
   ```

---

## Summary of Files Prepared for Deployment
- **`requirements.txt`** (Created in `/emotionDetection`): Formatted with `tensorflow-cpu`, `opencv-python-headless`, and `gunicorn` for a lightweight, headless, cloud-safe execution.
- **`/detect_frame` Route** (Added to `main.py`): Implemented a Base64 decoder to parse images captured in client web browsers.
