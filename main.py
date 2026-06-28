import os
import time
import threading
import base64
from keras.models import load_model
from time import sleep
from keras.preprocessing.image import img_to_array
from keras.preprocessing import image
import cv2 #OpenCV ---> video is a collection of frames
import numpy as np
from flask import Flask , render_template, jsonify, Response, request

app = Flask(__name__)

# Global variables to communicate between stream and detect
current_mood = None
detection_done = False

# Get absolute path to the directory containing main.py
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
face_classifier_path = os.path.join(BASE_DIR, 'haarcascade_frontalface_default.xml')
model_path = os.path.join(BASE_DIR, 'model.h5')

# Camera settings: Set to 0 for system/default webcam, or an IP address string/path
CAMERA_SOURCE = 0

# Load models globally so it doesn't crash or slow down the video stream
face_classifier = cv2.CascadeClassifier(face_classifier_path)
classifier = load_model(model_path)
emotion_labels = ['Angry','Disgust','Fear','Happy','Neutral', 'Sad', 'Surprise']

class CameraStreamer:
    def __init__(self):
        self.cap = None
        self.lock = threading.Lock()
        self.current_mood = "Neutral"
        self.mood_counts = {}
        self.is_running = False
        self.frame = None
        self.thread = None

    def start(self):
        with self.lock:
            if not self.is_running:
                self.cap = cv2.VideoCapture(CAMERA_SOURCE)
                if self.cap.isOpened():
                    self.is_running = True
                    self.mood_counts = {}
                    self.current_mood = "Neutral"
                    self.thread = threading.Thread(target=self._run)
                    self.thread.daemon = True
                    self.thread.start()

    def _run(self):
        while self.is_running:
            success, frame = self.cap.read()
            if not success:
                break
            
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = face_classifier.detectMultiScale(gray)
            
            for (x, y, w, h) in faces:
                cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 255), 2)
                roi_gray = gray[y:y+h, x:x+w]
                roi_gray = cv2.resize(roi_gray, (48, 48), interpolation=cv2.INTER_AREA)

                if np.sum([roi_gray]) != 0:
                    roi = roi_gray.astype('float') / 255.0
                    roi = img_to_array(roi)
                    roi = np.expand_dims(roi, axis=0)

                    prediction = classifier.predict(roi, verbose=0)[0]
                    label = emotion_labels[prediction.argmax()]
                    
                    # Accumulate mood counts
                    self.mood_counts[label] = self.mood_counts.get(label, 0) + 1
                    
                    cv2.putText(frame, label, (x, y), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
                else:
                    cv2.putText(frame, 'No Faces', (30, 80), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            
            self.frame = frame
            time.sleep(0.03)

    def get_frame(self):
        if self.frame is None:
            return None
        ret, buffer = cv2.imencode('.jpg', self.frame)
        if not ret:
            return None
        return buffer.tobytes()

    def stop(self):
        with self.lock:
            if self.is_running:
                self.is_running = False
                if self.cap:
                    self.cap.release()
                cv2.destroyAllWindows()
                
                # Determine final mood
                if self.mood_counts:
                    self.current_mood = max(zip(self.mood_counts.values(), self.mood_counts.keys()))[1]
                else:
                    self.current_mood = "Neutral"

streamer = CameraStreamer()

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

@app.route('/video_feed')
def video_feed():
    def gen():
        streamer.start()
        while streamer.is_running:
            frame_bytes = streamer.get_frame()
            if frame_bytes is not None:
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            time.sleep(0.04)
    return Response(gen(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/detect')
def detect():
    streamer.start()
    if not streamer.is_running:
        return jsonify({"mood": "Camera Error"})
        
    # Wait for 3.5 seconds to capture emotion data (approx 100 frames)
    time.sleep(3.5)
    
    streamer.stop()
    return jsonify({"mood": streamer.current_mood})

@app.route('/detect_frame', methods=['POST'])
def detect_frame():
    try:
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({"error": "No image data"}), 400
            
        # Decode base64 image
        img_data = data['image'].split(',')[1] if ',' in data['image'] else data['image']
        img_bytes = base64.b64decode(img_data)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return jsonify({"error": "Invalid image"}), 400
            
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_classifier.detectMultiScale(gray)
        
        label = "Neutral"
        for (x, y, w, h) in faces:
            roi_gray = gray[y:y+h, x:x+w]
            roi_gray = cv2.resize(roi_gray, (48, 48), interpolation=cv2.INTER_AREA)

            if np.sum([roi_gray]) != 0:
                roi = roi_gray.astype('float') / 255.0
                roi = img_to_array(roi)
                roi = np.expand_dims(roi, axis=0)

                prediction = classifier.predict(roi, verbose=0)[0]
                label = emotion_labels[prediction.argmax()]
                break  # process the first detected face
                
        return jsonify({"mood": label})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.debug = True
    app.run()