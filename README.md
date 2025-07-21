# MeetHub

A modern meeting platform built with Next.js, NestJS, and Turborepo.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18
- pnpm >= 9.0.0
- MongoDB (local hoặc MongoDB Atlas)
- Redis (cho caching và real-time features)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd MeetHub

# Install all dependencies
pnpm install
```

## 🔧 Environment Configuration

### Backend Environment (apps/api/.env)

Tạo file `.env` trong thư mục `apps/api/` với các biến môi trường sau:

```env
# Server Configuration
PORT=8000
API_PREFIX=api
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/meethub?retryWrites=true&w=majority

# CORS Configuration
CORS_ORIGINS=http://localhost:3000
CORS_CREDENTIALS=true
CORS_METHODS=GET, POST, PUT, DELETE, PATCH, OPTIONS
CORS_ALLOWED_HEADERS=Content-Type, Authorization, X-Requested-With

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:8000/api/auth/google/callback

# Authentication
SESSION_SECRET=your_session_secret_key
SECRET_JWT=your_jwt_secret_key

# Email Service (Gmail)
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_app_password

# Cloud Storage (Cloudinary)
CLOUD_NAME=your_cloudinary_cloud_name
API_KEY_CLOUD=your_cloudinary_api_key
API_KEY_CLOUD_SECR=your_cloudinary_api_secret

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# API Version
API_VERSION=v1

# Redis Configuration
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
```

### Frontend Environment (apps/web/.env.local)

Tạo file `.env.local` trong thư mục `apps/web/` với các biến môi trường sau:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=http://localhost:8000

# Environment
NODE_ENV=development
```

## 📁 Project Structure

```
MeetHub/
├── apps/
│   ├── web/          # Next.js frontend application
│   │   ├── src/
│   │   │   ├── app/          # App Router pages
│   │   │   ├── components/   # React components
│   │   │   ├── services/     # API services
│   │   │   ├── store/        # State management
│   │   │   ├── hooks/        # Custom hooks
│   │   │   └── types/        # TypeScript types
│   │   └── public/           # Static assets
│   └── api/          # NestJS backend API
│       ├── src/
│       │   ├── modules/      # Feature modules
│       │   ├── common/       # Shared utilities
│       │   │   ├── decorators/   # Custom decorators
│       │   │   ├── filters/      # Exception filters
│       │   │   ├── guards/       # Authentication guards
│       │   │   ├── interceptors/ # Request/response interceptors
│       │   │   ├── interfaces/   # Shared interfaces
│       │   │   └── services/     # Shared services
│       │   ├── gateway/      # WebSocket gateways
│       │   ├── auth/         # Authentication
│       │   └── database/     # Database configuration
│       └── prisma/           # Database schema
├── packages/
│   └── ui/           # Shared UI components (future)
├── package.json      # Root package.json with workspace scripts
├── turbo.json        # Turborepo configuration
└── pnpm-workspace.yaml # pnpm workspace configuration
```

## 🛠️ Development

### Start all applications

```bash
# Start both web and API in development mode
pnpm dev
```

### Start specific applications

```bash
# Start only the web application
pnpm dev:web

# Start only the API
pnpm dev:api
```

### Build all applications

```bash
# Build all apps and packages
pnpm build
```

### Code Quality

```bash
# Run linting across all packages
pnpm lint

# Check TypeScript types
pnpm check-types

# Format code with Prettier
pnpm format
```

## 🌐 Applications

### Web App (`apps/web`)

- **Framework**: Next.js 15 với App Router
- **UI Library**: Ant Design
- **Styling**: CSS Modules + Tailwind CSS
- **State Management**: Zustand
- **Real-time**: Socket.IO Client
- **Port**: 3000

### API (`apps/api`)

- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: MongoDB với Prisma ORM
- **Authentication**: JWT + Google OAuth
- **Real-time**: Socket.IO
- **File Upload**: Cloudinary
- **Email**: Nodemailer
- **Caching**: Redis
- **Port**: 8000

## ✨ Features

### 🔐 Authentication & Authorization

- **Đăng ký/Đăng nhập** với email và mật khẩu
- **Google OAuth** tích hợp
- **JWT Token** authentication
- **Session management** với Redis
- **Password reset** qua email

### 👥 User Management

- **User profiles** với avatar và thông tin cá nhân
- **Online/offline status** real-time
- **User search** và filtering
- **User invitations** để kết nối

### 💬 Real-time Chat

- **Private messages** giữa 2 người dùng
- **Group chat** với nhiều thành viên
- **Real-time messaging** với Socket.IO
- **Message reactions** (like, heart, etc.)
- **Message status** (sent, delivered, read)
- **File sharing** trong chat
- **Chat notifications** real-time

### 📅 Room Booking System

- **Tạo phòng họp** với thông tin chi tiết
- **Đặt lịch phòng** với calendar
- **Room availability** checking
- **Booking management** (create, update, cancel)
- **Room search** và filtering
- **Admin room management**

### 🔔 Notifications

- **Real-time notifications** cho chat messages
- **Email notifications** cho booking updates
- **Push notifications** cho important events
- **Notification preferences** management

### 📁 File Management

- **File upload** với Cloudinary
- **Image optimization** và compression
- **File sharing** trong chat
- **File size limits** và validation

### 🎨 UI/UX Features

- **Responsive design** cho mobile và desktop
- **Dark/Light theme** support
- **Loading states** và error handling
- **Toast notifications** cho user feedback
- **Modal dialogs** cho complex interactions
- **Infinite scrolling** cho chat history

### 🔧 Admin Features

- **User management** dashboard
- **Room management** interface
- **Booking analytics** và reports
- **System monitoring** và logs

## 🏗️ Build & Deploy

### Local Build

```bash
# Build all applications
pnpm build

# Build specific application
pnpm build --filter=web
pnpm build --filter=api
```

### Production Deployment

#### Frontend (Vercel/Netlify)

```bash
# Build for production
pnpm build --filter=web

# Deploy to Vercel
vercel --prod
```

#### Backend (Railway/Heroku)

```bash
# Build for production
pnpm build --filter=api

# Set production environment variables
# Deploy to your preferred platform
```

### Environment Variables for Production

#### Frontend (.env.production)

```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com
NEXT_PUBLIC_WS_URL=https://your-api-domain.com
NODE_ENV=production
```

#### Backend (.env.production)

```env
PORT=8000
NODE_ENV=production
MONGODB_URI=your_production_mongodb_uri
REDIS_HOST=your_redis_host
REDIS_PASSWORD=your_redis_password
# ... other production variables
```

## 📦 Available Scripts

| Script             | Description                                |
| ------------------ | ------------------------------------------ |
| `pnpm dev`         | Start all applications in development mode |
| `pnpm dev:web`     | Start only the web application             |
| `pnpm dev:api`     | Start only the API                         |
| `pnpm build`       | Build all applications                     |
| `pnpm lint`        | Run ESLint across all packages             |
| `pnpm check-types` | Run TypeScript type checking               |
| `pnpm format`      | Format code with Prettier                  |
| `pnpm test`        | Run tests across all packages              |

## 🚀 Getting Started

1. **Install dependencies**:

   ```bash
   pnpm install
   ```

2. **Setup environment variables**:
   - Tạo file `.env` trong `apps/api/`
   - Tạo file `.env.local` trong `apps/web/`
   - Cấu hình các biến môi trường theo hướng dẫn trên

3. **Setup database**:

   ```bash
   # Chạy database migrations
   cd apps/api
   npx prisma generate
   npx prisma db push
   ```

4. **Start Redis server**:

   ```bash
   # Local Redis
   redis-server

   # Hoặc sử dụng Docker
   docker run -d -p 6379:6379 redis:alpine
   ```

5. **Start development servers**:

   ```bash
   pnpm dev
   ```

6. **Open your browser**:
   - Web App: http://localhost:3000
   - API: http://localhost:8000

## 🔧 Configuration Tips

### MongoDB Setup

- Sử dụng MongoDB Atlas cho production
- Tạo database user với quyền read/write
- Whitelist IP addresses cho security

### Redis Setup

- Sử dụng Redis Cloud cho production
- Cấu hình password authentication
- Set up Redis persistence

### Google OAuth Setup

1. Tạo project trong Google Cloud Console
2. Enable Google+ API
3. Tạo OAuth 2.0 credentials
4. Cấu hình authorized redirect URIs

### Cloudinary Setup

1. Tạo account trên Cloudinary
2. Lấy Cloud Name, API Key, và API Secret
3. Cấu hình upload presets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation when needed
- Follow the existing code style

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

Nếu bạn gặp vấn đề hoặc có câu hỏi:

- Tạo issue trên GitHub
- Kiểm tra documentation
- Liên hệ team development

## 📂 **Chi tiết Chức năng từng Folder/File**

### 🎯 **Frontend (apps/web/)**

#### **📁 app/** - Next.js App Router

- **admin/**: Dashboard quản trị viên
  - `bookings/`: Quản lý đặt phòng
  - `rooms/`: Quản lý phòng họp
  - `users/`: Quản lý người dùng
- **bookings/**: Trang đặt phòng cho người dùng
- **chat/**: Ứng dụng chat real-time
- **forgetPass/**: Quy trình reset mật khẩu
- **login/**: Trang đăng nhập
- **register/**: Trang đăng ký
- **layout.tsx**: Layout chính của ứng dụng
- **page.tsx**: Trang chủ
- **UserProvider.tsx**: Context provider cho user state

#### **📁 components/** - React Components

- **booking/**: Components liên quan đến đặt phòng
  - `BookingDetailModal.tsx`: Modal chi tiết đặt phòng
  - `table.tsx`: Bảng hiển thị danh sách đặt phòng
- **chat/**: Components chat chính
  - `ChatHeader.tsx`: Header của chat window
  - `ChatInput.tsx`: Input nhập tin nhắn
  - `ChatList.tsx`: Danh sách tin nhắn
  - `ChatMessageItem.tsx`: Component hiển thị tin nhắn
- **chat-popup/**: Components chat popup
  - `ChatMessageItem.tsx`: Tin nhắn trong popup
  - `ChatMessageList.tsx`: Danh sách tin nhắn popup
  - `ChatPopupBottom.tsx`: Bottom bar của popup
  - `SelectUsersModal.tsx`: Modal chọn người dùng
- **home/**: Components trang chủ
  - `ConnectSection.tsx`: Section kết nối người dùng
  - `InvitationCard.tsx`: Card lời mời
  - `LoadingCard.tsx`: Card loading
  - `RightSidebar.tsx`: Sidebar bên phải
  - `UsersList.tsx`: Danh sách người dùng
  - `useConnectSection.tsx`: Hook cho connect section
- **notification/**: Components thông báo
  - `NotificationItemComponent.tsx`: Component thông báo
  - `NotificationList.tsx`: Danh sách thông báo
- **user/**: Components liên quan đến user
  - `modal.getcode.tsx`: Modal lấy mã xác thực
  - `user.model.tsx`: Modal thông tin user
- **AddRoom.tsx**: Component tạo phòng mới
- **AuthGuard.tsx**: Guard bảo vệ route
- **BookingCancel.tsx**: Component hủy đặt phòng
- **ChatIcon.tsx**: Icon chat với popup
- **CustomButton.tsx**: Button component tùy chỉnh
- **Header.tsx**: Header chính của ứng dụng
- **LoadingSpinner.tsx**: Component loading

#### **📁 services/** - API Services & Utilities

- **api/**: Các service gọi API
  - `auth.api.ts`: API authentication
  - `booking.api.ts`: API đặt phòng
  - `chat.api.ts`: API chat
  - `invitation.api.ts`: API lời mời
  - `notification.api.ts`: API thông báo
  - `room.api.ts`: API phòng
  - `users.api.ts`: API người dùng
- **axios/**: Cấu hình Axios
  - `customer.axios.ts`: Instance Axios cho client
- **websocket/**: WebSocket services
  - `core-handlers.ts`: Core event handlers
  - `error-events.ts`: Xử lý lỗi WebSocket
  - `event-binders.ts`: Bind events
  - `websocket.utils.ts`: Utilities WebSocket

#### **📁 store/** - State Management (Zustand)

- `chat.store.ts`: State quản lý chat
- `user.store.ts`: State quản lý user
- `websocket.store.ts`: State quản lý WebSocket
- **selectors/**: Selectors cho state
  - `chatSelectors.ts`: Selectors cho chat state

#### **📁 hooks/** - Custom React Hooks

- `useAuth.ts`: Hook xử lý authentication
- `useChat.ts`: Hook xử lý chat
- `useNotification.ts`: Hook xử lý notification

#### **📁 lib/** - Utility Libraries

- `api.ts`: Cấu hình API

#### **📁 constants/** - Application Constants

- `websocket.events.ts`: Constants cho WebSocket events

#### **📁 types/** - TypeScript Type Definitions

- `chat.ts`: Types liên quan đến chat
- `websocket.ts`: Types liên quan đến WebSocket

#### **📁 utils/** - Utility Functions

- `online-users.utils.ts`: Utilities cho online users
- `storage.utils.ts`: Utilities cho local storage
- `websocket.utils.ts`: Utilities cho WebSocket

#### **📁 style/** - Global Styles

- `globals.css`: CSS global

### 🔧 **Backend (apps/api/)**

#### **📁 modules/** - Feature Modules

##### **users/** - User Management

- **dto/**: Data Transfer Objects
  - `create-user.dto.ts`: DTO tạo user
  - `update-user-me.dto.ts`: DTO cập nhật thông tin cá nhân
  - `pagination-query.dto.ts`: DTO phân trang
- **schema/**: Database schemas
  - `user.schema.ts`: Schema user
- `users.controller.ts`: Controller xử lý HTTP requests
- `users.service.ts`: Business logic cho user
- `users.module.ts`: Module user

##### **rooms/** - Room Management

- **dto/**: Room DTOs
  - `create-room.dto.ts`: DTO tạo phòng
  - `update-rooms.dto.ts`: DTO cập nhật phòng
- **interface/**: Room interfaces
  - `room.interface.ts`: Interface phòng
  - `room.service.interface.ts`: Interface service phòng
- `room.schema.ts`: Schema phòng
- `room.tokens.ts`: Dependency injection tokens
- `rooms.controller.ts`: Controller phòng
- `rooms.service.ts`: Business logic phòng
- `rooms.module.ts`: Module phòng

##### **booking/** - Booking Management

- **dto/**: Booking DTOs
  - `create-booking.dto.ts`: DTO tạo booking
  - `search-bookings.dto.ts`: DTO tìm kiếm booking
  - `search-bookings-detailed.dto.ts`: DTO tìm kiếm chi tiết
- **interface/**: Booking interfaces
  - `booking.interface.ts`: Interface booking
  - `booking.service.interface.ts`: Interface service booking
- `booking.schema.ts`: Schema booking
- `booking.tokens.ts`: Dependency injection tokens
- `bookings.controller.ts`: Controller booking
- `bookings.service.ts`: Business logic booking
- `bookings.module.ts`: Module booking

##### **chat/** - Chat Functionality

- **chat-message/**: Message management
  - **dto/**: Message DTOs
    - `create-message.dto.ts`: DTO tạo tin nhắn
    - `create-room.dto.ts`: DTO tạo phòng chat
    - `delete-message.dto.ts`: DTO xóa tin nhắn
    - `update-message.dto.ts`: DTO cập nhật tin nhắn
  - **interfaces/**: Message interfaces
    - `index.ts`: Export interfaces
    - `response.interface.ts`: Interface response
  - **schema/**: Message schemas
    - `message.schema.ts`: Schema tin nhắn
    - `message-status.schema.ts`: Schema trạng thái tin nhắn
  - `message.controller.ts`: Controller tin nhắn
  - `message.service.ts`: Business logic tin nhắn
  - `message.module.ts`: Module tin nhắn

- **chat-room/**: Chat room management
  - **dto/**: Room DTOs
    - `create-room.dto.ts`: DTO tạo phòng chat
    - `update-room.dto.ts`: DTO cập nhật phòng
    - `join-room.dto.ts`: DTO tham gia phòng
    - `leave-room.dto.ts`: DTO rời phòng
  - **interfaces/**: Room interfaces
    - `room.interface.ts`: Interface phòng chat
  - **schema/**: Room schemas
    - `room.schema.ts`: Schema phòng chat
    - `room-member.schema.ts`: Schema thành viên phòng
  - `room.controller.ts`: Controller phòng chat
  - `room.service.ts`: Business logic phòng chat
  - `room.module.ts`: Module phòng chat

- **chat-user/**: Chat user management
  - **dto/**: User DTOs
    - `update-user.dto.ts`: DTO cập nhật user chat
    - `get-user.dto.ts`: DTO lấy thông tin user
  - **schema/**: User schemas
    - `user-chat.schema.ts`: Schema user chat
  - `user-chat.controller.ts`: Controller user chat
  - `user-chat.service.ts`: Business logic user chat
  - `user-chat.module.ts`: Module user chat

- **chat-invitation/**: Chat invitation management
  - **dto/**: Invitation DTOs
    - `create-invitation.dto.ts`: DTO tạo lời mời
  - **schema/**: Invitation schemas
    - `invitation.schema.ts`: Schema lời mời
  - `invitation.controller.ts`: Controller lời mời
  - `invitation.service.ts`: Business logic lời mời
  - `invitation.module.ts`: Module lời mời

- **chat-notification/**: Chat notification management
  - **dto/**: Notification DTOs
    - `create-notification.dto.ts`: DTO tạo thông báo
    - `update-notification.dto.ts`: DTO cập nhật thông báo
    - `index.ts`: Export DTOs
  - **schema/**: Notification schemas
    - `notification.schema.ts`: Schema thông báo
  - `notification.service.ts`: Business logic thông báo
  - `notification.module.ts`: Module thông báo

- **chat-reactions/**: Message reactions
  - **dto/**: Reaction DTOs
    - `create-reaction.dto.ts`: DTO tạo reaction
    - `delete-reaction.dto.ts`: DTO xóa reaction
  - **schema/**: Reaction schemas
    - `reaction.schema.ts`: Schema reaction
  - `reaction.controller.ts`: Controller reaction
  - `reaction.service.ts`: Business logic reaction
  - `reaction.module.ts`: Module reaction

- `chat.module.ts`: Main chat module

##### **notification/** - System Notification

- **dto/**: Notification DTOs
  - `create-notification.dto.ts`: DTO tạo thông báo hệ thống
  - `update-notification.dto.ts`: DTO cập nhật thông báo
- **schema/**: Notification schemas
  - `notification.schema.ts`: Schema thông báo hệ thống
- `notification.controller.ts`: Controller thông báo
- `notification.gateway.ts`: WebSocket gateway thông báo
- `notification.service.ts`: Business logic thông báo
- `notification.module.ts`: Module thông báo

##### **participation-requests/** - Participation Request

- **dto/**: Request DTOs
  - `create-participation-request.dto.ts`: DTO tạo yêu cầu tham gia
  - `search-participation-requests.dto.ts`: DTO tìm kiếm yêu cầu
  - `update-participation-request.dto.ts`: DTO cập nhật yêu cầu
- **interface/**: Request interfaces
  - `participation-request.interface.ts`: Interface yêu cầu
  - `participation-request.service.interface.ts`: Interface service
- **schemas/**: Request schemas
  - `participation-request.schema.ts`: Schema yêu cầu tham gia
- `participation-requests.controller.ts`: Controller yêu cầu
- `participation-requests.service.ts`: Business logic yêu cầu
- `participation-requests.module.ts`: Module yêu cầu

##### **password-reset/** - Password Reset

- **dto/**: Password reset DTOs
  - `create-password-reset.dto.ts`: DTO tạo reset password
  - `VerifyResetPasswordDto.ts`: DTO xác thực reset password
- `password-reset.controller.ts`: Controller reset password
- `password-reset.service.ts`: Business logic reset password
- `password-reset.module.ts`: Module reset password

##### **upload/** - File Upload

- `cloudinary.provider.ts`: Cấu hình Cloudinary
- **schema/**: Upload schemas
  - `image.schema.ts`: Schema hình ảnh
- `upload.controller.ts`: Controller upload
- `upload.service.ts`: Business logic upload
- `upload.module.ts`: Module upload

##### **redis/** - Redis Module

- `index.ts`: Cấu hình Redis
- `redis.module.ts`: Module Redis

#### **📁 common/** - Shared Utilities & Middleware

- **decorators/**: Custom decorators
  - `current-user.decorator.ts`: Decorator lấy user hiện tại
  - `ws-user.decorator.ts`: Decorator user cho WebSocket
- **filters/**: Exception filters
  - `http-exception.filter.ts`: Filter xử lý HTTP exceptions
- **guards/**: Authentication guards
  - `jwt-auth.guard.ts`: Guard JWT authentication
  - `ws-auth.guard.ts`: Guard WebSocket authentication
- **interceptors/**: Request/response interceptors
  - `logging.interceptor.ts`: Interceptor logging requests
  - `response.interceptor.ts`: Interceptor format response
- **interfaces/**: Shared interfaces
  - `ws-response.interface.ts`: Interface response WebSocket
- **services/**: Shared services
  - `ws-auth.service.ts`: Service authentication WebSocket
- `ws-auth.module.ts`: Module authentication WebSocket
- `README.md`: Documentation common module

#### **📁 gateway/** - WebSocket Gateways

- **handlers/**: Event handlers
  - `connection.handler.ts`: Handler sự kiện kết nối
  - `message.handler.ts`: Handler sự kiện tin nhắn
  - `room.handler.ts`: Handler sự kiện phòng
  - `user.handler.ts`: Handler sự kiện user
  - `notification.handler.ts`: Handler sự kiện thông báo
- **utils/**: Gateway utilities
  - `error.util.ts`: Utilities xử lý lỗi
  - `socket.util.ts`: Utilities socket
  - `validation.util.ts`: Utilities validation
- `chat.gateway.ts`: Gateway chat WebSocket
- `chat.service.ts`: Service chat WebSocket
- `gateway.module.ts`: Module gateway

#### **📁 auth/** - Authentication Module

- **interfaces/**: Auth interfaces
  - `user-payload.interface.ts`: Interface payload user
- **strategies/**: Authentication strategies
  - `google.strategy.ts`: Strategy Google OAuth
- `auth.controller.ts`: Controller authentication
- `auth.guard.ts`: Guard authentication
- `auth.service.ts`: Service authentication
- `auth.module.ts`: Module authentication

#### **📁 login-resgister/** - Login/Register Module

- **dto/**: Auth DTOs
  - `register.dto.ts`: DTO đăng ký
  - `send-code.dto.ts`: DTO gửi mã xác thực
  - `verify-code.dto.ts`: DTO xác thực mã
- **shemas/**: Auth schemas
  - `verify-code.schema.ts`: Schema mã xác thực
- `login-resgister.controller.ts`: Controller auth
- `login-resgister.service.ts`: Business logic auth
- `login-resgister.module.ts`: Module auth

#### **📁 database/** - Database Configuration

- `prisma.module.ts`: Module Prisma
- `prisma.service.ts`: Service Prisma

#### **📁 config/** - Configuration Files

- Các file cấu hình ứng dụng

#### **📁 utils/** - Utility Functions

- `brcrypt.password.ts`: Utilities hash password
- `util.ts`: Utilities chung

#### **📁 variables/** - Application Constants

- `CONST_STATUS.ts`: Constants trạng thái

#### **📁 types/** - TypeScript Types

- `express.d.ts`: Extensions types Express

#### **Root Files**

- `app.controller.ts`: Controller chính ứng dụng
- `app.module.ts`: Module gốc ứng dụng
- `app.service.ts`: Service chính ứng dụng
- `main.ts`: Entry point ứng dụng

#### **📁 prisma/** - Database Schema & Migrations

- `schema.prisma`: Schema database Prisma

#### **📁 test/** - Test Files

- `app.e2e-spec.ts`: End-to-end tests
- `jest-e2e.json`: Cấu hình Jest E2E

### 📦 **Packages**

- **ui/**: Shared UI components (future development)

### 🔧 **Root Configuration**

- `package.json`: Root dependencies và scripts
- `turbo.json`: Cấu hình Turborepo
- `pnpm-workspace.yaml`: Cấu hình pnpm workspace

## 🔄 Changelog

### v1.0.0

- Initial release
- Basic authentication system
- Real-time chat functionality
- Room booking system
- File upload support
- Admin dashboard
