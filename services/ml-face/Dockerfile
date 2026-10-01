# ml-face — MediaPipe FaceMesh + Pose + SelfieSegmentation over FastAPI.
FROM python:3.12-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-0 libgomp1 \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir uv
COPY pyproject.toml uv.lock* ./
RUN uv pip install --system --no-cache -r pyproject.toml \
    || pip install --no-cache-dir fastapi uvicorn[standard] opencv-python-headless \
                                   numpy pillow python-multipart mediapipe==0.10.20

COPY app ./app
EXPOSE 5001
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5001"]
