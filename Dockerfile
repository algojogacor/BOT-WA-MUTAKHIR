FROM node:20-bookworm

# Install sistem dependencies
RUN apt-get update && \
    apt-get install -y \
    ffmpeg \
    imagemagick \
    webp \
    python3 \
    python3-pip \
    chromium \
    --no-install-recommends && \
    apt-get upgrade -y && \
    rm -rf /var/lib/apt/lists/*

# Install Python library
RUN pip3 install pillow --break-system-packages

# Set working directory
WORKDIR /app

# Copy package files dulu (layer cache)
COPY commands/package*.json ./

# Install Node.js dependencies
RUN npm install --production

# Install node-cron (tambahan v2.0)
RUN npm install node-cron

# Copy semua file bot
COPY . .

# Buat direktori penting
RUN mkdir -p session temp helpers

# Expose port
EXPOSE 3000

# Jalankan bot
CMD ["node", "index.js"]
