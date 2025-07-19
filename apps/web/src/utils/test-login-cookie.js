// Test script để kiểm tra login và cookie
// Copy và paste vào DevTools Console

const testLoginCookie = async () => {
  console.log('=== Test Login và Cookie ===');
  
  // 1. Kiểm tra cookies trước login
  console.log('1. Cookies trước login:', document.cookie);
  
  // 2. Test login
  try {
    console.log('2. Gọi login API...');
    const loginResponse = await fetch('http://localhost:8000/api/auth/signIn', {
      method: 'POST',
      credentials: 'include', // Quan trọng để nhận cookies
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@gmail.com', // Thay bằng email thật
        password: '123456', // Thay bằng password thật
      }),
    });
    
    console.log('3. Login response status:', loginResponse.status);
    console.log('4. Login response headers:', loginResponse.headers);
    
    const loginData = await loginResponse.json();
    console.log('5. Login response data:', loginData);
    
    if (loginData.success) {
      localStorage.setItem('access_token', loginData.data.access_token);
      console.log('6. Access token đã được lưu');
    }
    
    // 3. Kiểm tra cookies sau login
    console.log('7. Cookies sau login:', document.cookie);
    
    // 4. Test refresh token ngay lập tức
    console.log('8. Test refresh token...');
    const refreshResponse = await fetch('http://localhost:8000/api/auth/refresh-token', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const refreshData = await refreshResponse.json();
    console.log('9. Refresh token response:', refreshData);
    
    if (refreshData.success) {
      console.log('✅ Refresh token thành công!');
      localStorage.setItem('access_token', refreshData.data.access_token);
    } else {
      console.log('❌ Refresh token thất bại:', refreshData.message);
    }
    
  } catch (error) {
    console.log('❌ Lỗi:', error);
  }
  
  console.log('=== Kết thúc test ===');
};

// Chạy test
testLoginCookie(); 