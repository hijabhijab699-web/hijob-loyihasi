# ml-garment — background removal + landmark extraction + canonical canvas.
# Bakes u2net.onnx into the image so first boot doesn't stall on a 176 MB download.
FROM python:3.12-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-0 libgomp1 curl \
    && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir uv
COPY pyproject.toml uv.lock* ./
RUN uv pip install --system --no-cache -r pyproject.toml \
    || pip install --no-cache-dir fastapi uvicorn[standard] opencv-python-headless \
                                   numpy pillow python-multipart rembg[cpu] mediapipe==0.10.20 \
                                   scikit-learn onnxruntime

# Pre-download the rembg u2net model (~176 MB) — avoids first-request stall.
RUN mkdir -p /root/.u2net && \
    curl -fSL -o /root/.u2net/u2net.onnx \
      https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2net.onnx

COPY app ./app
EXPOSE 5003
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5003"]
