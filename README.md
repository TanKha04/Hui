# Tra Cứu Huội - Phần Mềm Quản Lý & Tra Cứu Dây Hụi

Ứng dụng web quản lý hụi chuyên nghiệp, chuẩn xác theo nguyên lí hụi Việt Nam (20 thành viên/chân hụi, 50% tiền thảo chủ hụi, tính tiền hốt - tiền lời theo số tháng còn lại, quản lý đóng hụi / công nợ còn lại, xuất file Word Giấy Hụi), có Database SQLite và Docker Compose.

---

## 🎯 1. Nguyên Lí Hoạt Động & Công Thức Tính Toán

- **Quy mô**: 1 dây hụi = 20 thành viên tương ứng 20 kỳ (tháng).
- **Mệnh giá**: $M$ (ví dụ: 2.000.000 VNĐ).
- **Hốt hụi tại kỳ $k$** (ví dụ: kỳ 11, tiền lời bỏ thăm $L = 200.000$ VNĐ):
  - Số tháng còn lại: $N_{cl} = 20 - k = 9$ tháng.
  - Tiền gốc 19 phần: $19 \times 2.000.000 = 38.000.000$ VNĐ.
  - Giảm trừ do kêu lời: $9 \times 200.000 = 1.800.000$ VNĐ.
  - Thảo hụi cho Chủ Hụi (50% của 1 chân): $2.000.000 \times 50\% = 1.000.000$ VNĐ.
  - **Số tiền thực hốt**:
    $$\text{Tiền Thực Hốt} = 38.000.000 - 1.800.000 - 1.000.000 = 35.200.000 \text{ VNĐ}$$
- **Đóng hụi**:
  - Chân **hụi sống** (chưa hốt): Đóng $M - L = 2.000.000 - 200.000 = 1.800.000$ VNĐ.
  - Chân **hụi chết** (đã hốt trước đó): Đóng đủ $100\% = 2.000.000$ VNĐ.

---

## 🚀 2. Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

### Cách 1: Chạy trực tiếp với Node.js
```bash
# 1. Cài đặt dependencies backend và frontend
npm install
cd client && npm install && npm run build && cd ..

# 2. Khởi chạy máy chủ
npm start
```
👉 Truy cập: `http://localhost:3000`

### Cách 2: Chạy với Docker & Docker Compose
```bash
docker compose up -d --build
```
👉 Truy cập: `http://localhost:3000`
- Cơ sở dữ liệu SQLite được tự động lưu trữ bền vững tại `./data/hui.db`.

---

## 📋 3. Các Chức Năng Chính

1. **Tạo Dây Hụi Mới**:
   - Nhập tên hụi, ngày bắt đầu, số tiền hụi (chọn nhanh 1tr, 2tr, 3tr, 5tr, 10tr... hoặc nhập tự do).
   - Tự động sinh bảng 20 thành viên.
2. **Bảng Hụi Chi Tiết**:
   - STT 1 đến 20, nhập/sửa tên trực tiếp.
   - Nút **Hốt Hụi**: Mở popup nhập tiền lời -> Tự động tính tiền thực nhận minh bạch -> Sau khi xác nhận, nút hốt của các thành viên khác trong kỳ đó sẽ bị khóa.
   - Nút **Đóng Hụi**: Hiển thị số tiền cần đóng, ngày đóng -> Xác nhận đã đóng -> Hiển thị "Đã đóng huội trong tháng này".
   - Nút **Còn Lại**: Xem tổng hợp công nợ các tháng trước chưa đóng -> Kèm nút "Đóng hết tiền huội" thanh toán toàn bộ nợ.
   - Cột **Ngày Đóng**: Xem lịch sử số tháng đã đóng (X/20 kỳ).
3. **In Giấy Hụi & Xuất File Word**:
   - Xuất file `.docx` Giấy thỏa thuận chơi hụi kèm danh sách 20 thành viên và chữ ký chuẩn mẫu.
4. **Máy Tính Hụi**:
   - Công cụ mô phỏng kịch bản hốt hụi và đóng hụi linh hoạt.
5. **Gom Hụi & Lịch Sử**:
   - Theo dõi tổng thu gom và lịch sử từng kỳ.
