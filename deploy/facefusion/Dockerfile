# Dockerfile — ml-compositor + ichida facefusion CLI bo'lgan single-image.
# Repo rootidan build qiling:
#   docker build -f deploy/facefusion/Dockerfile -t hijob/ml-compositor:ff .
# Yoki docker-compose'da ishlating (deploy/docker-compose.prod.yml ga qarang).
#
# Image hajmi ~3-4 GB (facefusion dependency'lari og'ir).

FROM python:3.12-slim AS runtime

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    FACEFUSION_DIR=/opt/facefusion \
    FACEFUSION_PY=/opt/facefusion/.venv/bin/python \
    FACEFUSION_TIMEOUT_S=240

RUN apt-get update && apt-get install -y --no-install-recommends \
      git ffmpeg libgl1 libglib2.0-0 libgomp1 libsm6 libxext6 \
      build-essential ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# ---------- 1-qavat: facefusion CLI va uning venv'i ----------
ARG FACEFUSION_REF=master
RUN git clone --depth 1 --branch ${FACEFUSION_REF} \
      https://github.com/facefusion/facefusion.git ${FACEFUSION_DIR} \
    && python3.12 -m venv ${FACEFUSION_DIR}/.venv \
    && ${FACEFUSION_DIR}/.venv/bin/pip install --upgrade pip wheel \
    && ${FACEFUSION_DIR}/.venv/bin/pip install \
         onnxruntime numpy opencv-python-headless pillow \
         "insightface>=0.7.3" tqdm psutil \
    && ( [ -f ${FACEFUSION_DIR}/requirements.txt ] \
         && ${FACEFUSION_DIR}/.venv/bin/pip install -r ${FACEFUSION_DIR}/requirements.txt \
         || true )

# ---------- 2-qavat: ml-compositor FastAPI ----------
WORKDIR /app
COPY services/ml-compositor/pyproject.toml services/ml-compositor/uv.lock* ./
RUN pip install uv \
 && uv pip install --system --no-cache -r pyproject.toml \
    || pip install fastapi 'uvicorn[standard]' opencv-python-headless \
                   numpy pillow python-multipart mediapipe==0.10.20

COPY services/ml-compositor/app ./app

EXPOSE 5002
# 2 worker — CPU'li VPS'da optimum. Katta CPU'da --workers 4.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5002", "--workers", "2"]
