# 📞 VOICE.APP - Unified Voice & Video Communication System

VOICE.APP là một nền tảng liên lạc thời gian thực thế hệ mới, hỗ trợ gọi thoại (Voice) và gọi video (Video) 1-on-1 với độ trễ cực thấp. Hệ thống được xây dựng trên kiến trúc hiện đại, sử dụng Go cho Backend hiệu năng cao và Next.js cho trải nghiệm người dùng cao cấp.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Go](https://img.shields.io/badge/backend-Go%201.21+-00ADD8?logo=go)
![Next.js](https://img.shields.io/badge/frontend-Next.js%2014-black?logo=next.js)
![WebRTC](https://img.shields.io/badge/protocol-WebRTC-orange?logo=webrtc)
![Tailwind](https://img.shields.io/badge/styling-Tailwind%20CSS-38B2AC?logo=tailwind-css)

## ✨ Tính năng nổi bật

- **🎥 Gọi Video & Voice 1-on-1:** Trải nghiệm gọi điện sắc nét với WebRTC, hỗ trợ cả âm thanh và hình ảnh chất lượng cao.
- **⚡ Signaling Thời gian thực:** Hệ thống Signaling tùy chỉnh qua WebSocket giúp kết nối nhanh chóng và ổn định.
- **🎙️ Visualizer Sóng âm:** Hiển thị biểu đồ sóng âm (Audio Frequency) sinh động khi đang đàm thoại.
- **📱 Quản lý danh bạ thông minh:** Tìm kiếm người dùng theo username/tên và quản lý danh sách liên lạc cá nhân.
- **📜 Nhật ký cuộc gọi chi tiết:** Lưu trữ lịch sử mọi cuộc gọi (Đã kết nối, Nhỡ, Từ chối) kèm thời gian thực tế.
- **🎨 Giao diện Ultra-Premium:** Thiết kế Dark Mode tinh xảo với hiệu ứng Glassmorphism, Neon Glow và chuyển cảnh mượt mà.
- **🔔 Thông báo thông minh:** Tích hợp Browser Notifications giúp bạn không bỏ lỡ cuộc gọi ngay cả khi đang làm việc ở Tab khác.
- **🔐 Bảo mật & Bền vững:** Hệ thống xác thực JWT với cơ chế Persistence Session (Zustand Persist).
- **⚙️ Tùy chỉnh linh hoạt:** Trang cài đặt thiết bị cho phép kiểm tra Micro và Camera trước khi tham gia cuộc gọi.

## 🛠️ Công nghệ sử dụng

### Backend (Golang)
- **Framework:** [Gin Gonic](https://github.com/gin-gonic/gin) - API RESTful tốc độ cao.
- **Database:** MySQL 8.0 (GORM) - Lưu trữ người dùng, danh bạ và lịch sử cuộc gọi.
- **Caching/PubSub:** Redis - Quản lý trạng thái Online/Offline và điều phối Signaling.
- **Real-time:** Gorilla WebSocket - Xử lý luồng tín hiệu WebRTC.
- **Auth:** JWT (JSON Web Tokens) - Bảo mật các endpoint API.

### Frontend (Next.js)
- **Framework:** Next.js 14 (App Router) - Tối ưu hóa hiệu năng và SEO.
- **Styling:** Tailwind CSS - Giao diện responsive và hiện đại.
- **State Management:** Zustand - Quản lý trạng thái cuộc gọi và thông tin người dùng toàn cục.
- **Icons:** Lucide React - Bộ icon vector sắc nét.
- **WebRTC:** Native Browser API - Xử lý luồng MediaStream trực tiếp giữa các trình duyệt.

## 🚀 Hướng dẫn cài đặt

### 1. Chuẩn bị hạ tầng (Docker)
Sử dụng Docker Compose để khởi chạy nhanh các dịch vụ cần thiết (MySQL, Redis):
```bash
docker-compose up -d
```
*Lưu ý: MySQL chạy trên cổng `3307`, Redis chạy trên cổng `6379`.*

### 2. Cài đặt Backend
```bash
cd backend-go
# Cấu hình .env từ file .env.example (nếu có)
go mod download
go run cmd/server/main.go
```

### 3. Cài đặt Frontend
```bash
cd front-end-next
pnpm install
pnpm dev
```
Truy cập: `http://localhost:3000` để trải nghiệm.

## 📸 Ảnh chụp màn hình & Giao diện
- **Dashboard:** Trung tâm điều khiển với Sidebar danh bạ và lịch sử cuộc gọi.
- **Calling State:** Trạng thái đang gọi với hiệu ứng sóng âm và Ping animation.
- **Video Call:** Chế độ hiển thị video người gọi và người nhận song song.
- **Settings:** Nơi cấu hình và kiểm tra thiết bị đầu vào.

## 📄 Giấy phép
Dự án được phát hành dưới giấy phép MIT.

---
*Phát triển bởi Đội ngũ Advanced Agentic Coding - Google Deepmind.*
