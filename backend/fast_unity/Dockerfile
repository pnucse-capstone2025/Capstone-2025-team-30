FROM python:3.10.12-slim

# 필수 패키지 설치
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates wget git \
    xvfb x11vnc fluxbox \
    libstdc++6 libgcc-s1 zlib1g \
    libglib2.0-0 libgdk-pixbuf-2.0-0 libgtk-3-0 libatk1.0-0 \
    libcairo2 libpango-1.0-0 libpangocairo-1.0-0 libfreetype6 \
    libx11-6 libxext6 libxrender1 libxrandr2 libxinerama1 libxcursor1 libxi6 \
    libxcomposite1 libxdamage1 libxfixes3 libxss1 libxtst6 libsm6 libxft2 \
    libasound2 libnss3 \
    libgl1-mesa-glx libglu1-mesa libgl1-mesa-dri libdrm2 libgbm1 libxkbcommon0 libxshmfence1 libxxf86vm1 libvulkan1 \
    fonts-dejavu-core \
    x11-utils \
 && rm -rf /var/lib/apt/lists/*

 RUN apt-get update && apt-get install -y --no-install-recommends \
    libx11-dev libxext-dev libxrandr-dev libxi-dev libxrender-dev libxfixes-dev \
 && rm -rf /var/lib/apt/lists/*
 
WORKDIR /app

ENV PYTHONPATH=/app



RUN pip install --no-cache-dir "torch==2.1.2" --index-url https://download.pytorch.org/whl/cpu 
RUN pip install --no-cache-dir --upgrade pip\
    mlagents-envs==1.1.0 \
    gymnasium==1.1.1 \
    tensorboard \
    requests\
    websocket-client \
    openai

RUN pip install --no-deps stable-baselines3==2.6.0

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY fast_unity/app /app/app
COPY fast_unity/unity  /app/unity
COPY fast_unity/entrypoint.sh /app/

RUN chmod +x /app/entrypoint.sh


ENV DISPLAY=:1 \
    XDG_RUNTIME_DIR=/tmp/runtime-root \
    LIBGL_ALWAYS_SOFTWARE=1
RUN mkdir -p /tmp/runtime-root /app/logs && chmod 700 /tmp/runtime-root


EXPOSE 8000 6080 5900

ENTRYPOINT ["/app/entrypoint.sh"]
