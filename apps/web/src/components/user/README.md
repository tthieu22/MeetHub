# User Filter Component

## Tổng quan
Component `UserFilter` được thiết kế để lọc danh sách người dùng với các tiêu chí khác nhau.

## Tính năng
- **Tìm kiếm theo tên**: Tìm kiếm người dùng theo tên (không phân biệt hoa thường)
- **Tìm kiếm theo email**: Tìm kiếm người dùng theo email (không phân biệt hoa thường)
- **Lọc theo vai trò**: Lọc theo vai trò admin hoặc user
- **Lọc theo trạng thái**: Lọc theo trạng thái hoạt động hoặc bị chặn
- **Reset filter**: Làm mới tất cả filter về trạng thái ban đầu

## Cách sử dụng

### 1. Import component
```tsx
import UserFilter, { UserFilterParams } from "./UserFilter";
```

### 2. Sử dụng trong component
```tsx
const [filterParams, setFilterParams] = useState<UserFilterParams>({});

const handleFilter = (params: UserFilterParams) => {
  setFilterParams(params);
  // Gọi API với params mới
  fetchUsers(params);
};

return (
  <UserFilter onFilter={handleFilter} loading={loading} />
);
```

### 3. Interface UserFilterParams
```tsx
interface UserFilterParams {
  name?: string;        // Tên người dùng
  email?: string;       // Email
  role?: "admin" | "user"; // Vai trò
  isActive?: boolean;   // Trạng thái
  page?: number;        // Trang hiện tại
  limit?: number;       // Số lượng item mỗi trang
  sort?: string;        // Sắp xếp (JSON string)
}
```

## API Backend

### Endpoint
```
GET /api/users/find-by-query
```

### Query Parameters
- `name`: Tìm kiếm theo tên (regex, case-insensitive)
- `email`: Tìm kiếm theo email (regex, case-insensitive)
- `role`: Lọc theo vai trò
- `isActive`: Lọc theo trạng thái
- `page`: Số trang
- `limit`: Số lượng item mỗi trang
- `sort`: JSON string cho sorting

### Response
```json
{
  "success": true,
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10,
  "data": [
    {
      "_id": "...",
      "name": "User Name",
      "email": "user@example.com",
      "role": "user",
      "isActive": true,
      "avatarURL": "..."
    }
  ]
}
```

## Ví dụ sử dụng

### Trong UserTableComponent
```tsx
const UserTableComponent = () => {
  const [filterParams, setFilterParams] = useState<UserFilterParams>({
    page: 1,
    limit: 10,
    sort: JSON.stringify({ createdAt: -1 }),
  });

  const handleFilter = (params: UserFilterParams) => {
    setFilterParams(params);
    setPage(1); // Reset về trang đầu khi filter
    fetchUsers(params);
  };

  return (
    <div>
      <UserFilter onFilter={handleFilter} loading={loading} />
      <Table dataSource={data} ... />
    </div>
  );
};
```

## Tính năng nâng cao

### 1. Debounce search
Có thể thêm debounce cho input search để tránh gọi API quá nhiều:

```tsx
import { debounce } from 'lodash';

const debouncedSearch = debounce((value) => {
  handleFilter({ ...filterParams, name: value });
}, 500);
```

### 2. URL params sync
Đồng bộ filter params với URL để có thể share/bookmark:

```tsx
import { useSearchParams, useRouter } from 'next/navigation';

const router = useRouter();
const searchParams = useSearchParams();

const updateURL = (params: UserFilterParams) => {
  const newSearchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      newSearchParams.set(key, String(value));
    }
  });
  router.push(`?${newSearchParams.toString()}`);
};
```

### 3. Export filtered data
Thêm nút export cho dữ liệu đã filter:

```tsx
const exportFilteredData = () => {
  const csvContent = convertToCSV(data);
  downloadCSV(csvContent, `users_${Date.now()}.csv`);
};
``` 