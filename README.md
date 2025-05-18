
# 💻 E-Commerce Website - Computer & Components Shop (Node.js + Express.js)

## 🌐 Mô tả tổng quan

Website thương mại điện tử cho phép:
- Người dùng xem, tìm kiếm, lọc và mua sản phẩm (không cần đăng nhập).
- Quản lý người dùng, sản phẩm, đơn hàng, giỏ hàng, giảm giá.
- Giao diện đơn giản, responsive, dễ sử dụng.
- Tích hợp các tính năng cần thiết cho cả người dùng và quản trị viên.

---

## 📑 Mục lục

- [📘 Thông tin dự án](#-thông-tin-dự-án)
- [🌐 Mô tả tổng quan](#-mô-tả-tổng-quan)
- [🎯 Tính năng chính](#-tính-năng-chính)
  - [🔓 Người dùng](#-người-dùng)
  - [🛍️ Mua hàng](#️-mua-hàng)
  - [⭐ Đánh giá & khách hàng thân thiết](#-đánh-giá--khách-hàng-thân-thiết)
  - [🧑‍💼 Admin](#-admin)
- [🧰 Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [🚀 Triển khai](#-triển-khai)
- [📦 Cài đặt (Local)](#-cài-đặt-local)
- [📁 Cấu trúc thư mục](#-cấu-trúc-thư-mục)
- [🧪 Các tính năng triển khai thêm (Bonus ✅)](#-các-tính-năng-triển-khai-thêm-bonus-)
- [🎥 Demo & báo cáo](#-demo--báo-cáo)
- [🔐 Thông tin đăng nhập (nếu dùng)](#-thông-tin-đăng-nhập-nếu-dùng)
- [🧑‍💻 Nhóm thực hiện](#-nhóm-thực-hiện)
- [📄 Giấy phép](#-giấy-phép)

---

## 🎯 Tính năng chính

### 🔓 Người dùng
- Đăng ký / Đăng nhập / Đăng nhập Google hoặc Facebook
- Xem và chỉnh sửa hồ sơ, thay đổi và khôi phục mật khẩu
- Quản lý nhiều địa chỉ giao hàng

### 🛍️ Mua hàng
- Duyệt và tìm kiếm sản phẩm theo danh mục
- Phân trang, sắp xếp, lọc theo giá, thương hiệu, xếp hạng
- Chi tiết sản phẩm với hình ảnh, mô tả, đánh giá, biến thể
- Thêm vào giỏ hàng, cập nhật số lượng
- Thanh toán nhiều bước, hỗ trợ mua nhanh không cần tài khoản
- Sử dụng mã giảm giá (5 ký tự) do admin tạo
- Nhận email xác nhận đơn hàng

### ⭐ Đánh giá & khách hàng thân thiết
- Bình luận (không cần đăng nhập), xếp hạng (phải đăng nhập)
- Cập nhật bình luận và xếp hạng bằng WebSocket
- Hệ thống tích điểm 10% theo giá trị đơn hàng

### 🧑‍💼 Admin
- Dashboard đơn giản & nâng cao (tùy chỉnh theo năm/quý/tháng/tuần)
- Quản lý sản phẩm, đơn hàng, người dùng, mã giảm giá
- Xem chi tiết, lọc, phân trang đơn hàng toàn hệ thống

---

## 🧰 Công nghệ sử dụng

### 🖥️ Backend
[![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)](https://nodejs.org/)

[![Express.js](https://img.shields.io/badge/Express.js-000000?logo=express&logoColor=white)](https://expressjs.com/)

### 🛢️ Database
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)


### 🔐 Authentication
[![JWT](https://img.shields.io/badge/JWT-000000?logo=jsonwebtokens&logoColor=white)](https://jwt.io/)

[![OAuth 2.0](https://img.shields.io/badge/OAuth%202.0-3C5A99?logo=oauth&logoColor=white)](https://oauth.net/2/)

### 🎨 UI/UX
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)


### 📦 Libs khác
[![bcrypt](https://img.shields.io/badge/Bcrypt-0079A1?logo=npm&logoColor=white)](https://github.com/kelektiv/node.bcrypt.js)

[![multer](https://img.shields.io/badge/Multer-333333?logo=npm&logoColor=white)](https://github.com/expressjs/multer)

[![nodemailer](https://img.shields.io/badge/Nodemailer-EA4335?logo=gmail&logoColor=white)](https://nodemailer.com/)

[![dotenv](https://img.shields.io/badge/dotenv-8DD6F9?logo=npm&logoColor=black)](https://github.com/motdotla/dotenv)


---

## 📦 Cài đặt (Local)

```bash
# Clone source
git clone https://github.com/DG-Kit/E-Commerce-Website---Computer-Components-Shop-Node.js-Express.js-
cd pc-store

# Cài dependencies
npm install

# Tạo file .env từ mẫu
cp .env.example .env.v.

# Khởi động
npm run dev


---

## 🧑‍💻 Nhóm thực hiện

| Họ Tên | MSSV |
|--------|------|
| Đặng Lữ Anh Kiệt | 521H0090 |


---

## 📄 Giấy phép

Dự án này chỉ phục vụ cho mục đích học tập trong môn học "Lập trình Web với Node.js" – không sử dụng vào mục đích thương mại.
