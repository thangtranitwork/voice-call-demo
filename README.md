# 📞 VOICE.APP - Real-time Voice Call System

VOICE.APP là một ứng dụng gọi điện trực tuyến 1-on-1 thời gian thực, được xây dựng với hiệu năng cao từ Go và trải nghiệm người dùng hiện đại từ Next.js. Hệ thống sử dụng WebRTC cho luồng âm thanh và WebSocket để xử lý tín hiệu (Signaling).

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Go](https://img.shields.io/badge/backend-Go%201.21+-00ADD8?logo=go)
![Next.js](https://img.shields.io/badge/frontend-Next.js%2014-black?logo=next.js)
![WebRTC](https://img.shields.io/badge/protocol-WebRTC-orange?logo=webrtc)

## ✨ Tính năng nổi bật

- **⚡ Gọi điện 1-on-1 Real-time:** Kết nối âm thanh chất lượng cao, độ trễ cực thấp thông qua WebRTC.
- **🎨 Giao diện Premium:** Thiết kế Dark Mode hiện đại, Glassmorphism, hiệu ứng chuyển cảnh mượt mà.
- **📱 Quản lý danh bạ:** Tìm kiếm người dùng và thêm vào danh bạ dễ dàng.
- **📜 Nhật ký cuộc gọi:** Lưu trữ lịch sử cuộc gọi (Đã nghe, Cuộc gọi nhỡ, Bị từ chối) trực tiếp vào MySQL.
- **🎙️ Visualizer Sóng âm:** Hiển thị biểu đồ sóng âm thời gian thực khi đang nói chuyện.
- **🔕 Mute/Unmute:** Tính năng tắt tiếng mic ngay trong cuộc gọi.
- **🔔 Thông báo trình duyệt:** Nhận thông báo hệ thống khi có cuộc gọi đến ngay cả khi đang ở Tab khác.
- **🔐 Đăng nhập bền vững:** Hệ thống JWT với tính năng ghi nhớ phiên đăng nhập (Persistent Session).

## 🛠️ Công nghệ sử dụng

### Backend (Golang)
- **Framework:** [Gin Gonic](https://github.com/gin-gonic/gin)
- **Database:** MySQL 8.0 (GORM)
- **Caching/PubSub:** Redis
- **Real-time:** Gorilla WebSocket
- **Auth:** JWT (JSON Web Tokens)

### Frontend (Next.js)
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **State Management:** Zustand (với Persist Middleware)
- **Icons:** Lucide React
- **WebRTC:** Native Browser API

## 🚀 Hướng dẫn cài đặt

### 1. Chuẩn bị môi trường (Docker)
Khởi động MySQL và Redis thông qua Docker Compose:
```bash
docker-compose up -d
```
*Lưu ý: MySQL sẽ chạy trên cổng `3307` để tránh xung đột với host.*

### 2. Cài đặt Backend
```bash
cd backend-go
# Cấu hình .env (đã có sẵn mẫu)
go mod download
go run cmd/server/main.go
```

### 3. Cài đặt Frontend
```bash
cd front-end-next
pnpm install
pnpm dev
```
Truy cập: `http://localhost:3000`

## 📸 Ảnh chụp màn hình (Mô tả)
- **Auth:** Giao diện đăng nhập/đăng ký sang trọng.
- **Dashboard:** Sidebar quản lý danh bạn và lịch sử cuộc gọi.
- **In-Call:** Màn hình cuộc gọi với Visualizer sóng âm và các nút điều khiển.

## 📄 Giấy phép
Dự án được phát hành dưới giấy phép MIT.

---
*Phát triển bởi Đội ngũ Advanced Agentic Coding - Google Deepmind.*
