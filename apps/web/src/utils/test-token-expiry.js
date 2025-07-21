// Test script để kiểm tra token expiry và auto refresh
// Copy và paste vào DevTools Console

const testTokenExpiry = async () => {
  console.log('=== Test Token Expiry và Auto Refresh ===');
  
  // 1. Kiểm tra token hiện tại
  const currentToken = localStorage.getItem('access_token');
  console.log('1. Token hiện tại:', currentToken ? 'Có' : 'Không');
  
  if (currentToken) {
    try {
      const payload = JSON.parse(atob(currentToken.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      const timeLeft = payload.exp - currentTime;
      console.log('2. Token expires in:', timeLeft, 'seconds');
      
      if (timeLeft > 0) {
        console.log('3. Token còn hạn, sẽ test bằng cách xóa token để simulate hết hạn');
        localStorage.removeItem('access_token');
        console.log('4. Đã xóa token để simulate hết hạn');
      }
    } catch (error) {
      console.log('2. Lỗi parse token:', error);
    }
  }
  
  // 5. Test API call với token đã "hết hạn"
  console.log('5. Test API call với token đã "hết hạn"...');
  try {
    const response = await fetch('http://localhost:8000/api/users/profile', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token') || 'invalid-token'}`,
      },
    });
    
    console.log('6. API response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API call thành công:', data);
    } else if (response.status === 401) {
      console.log('❌ API call thất bại với 401 - token hết hạn');
      console.log('7. Axios interceptor sẽ tự động refresh token...');
      
      // Test refresh token thủ công
      console.log('8. Test refresh token thủ công...');
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
        
        // Test API call lại với token mới
        console.log('10. Test API call lại với token mới...');
        const newResponse = await fetch('http://localhost:8000/api/users/profile', {
          headers: {
            'Authorization': `Bearer ${refreshData.data.access_token}`,
          },
        });
        
        if (newResponse.ok) {
          const newData = await newResponse.json();
          console.log('✅ API call thành công với token mới:', newData);
        } else {
          console.log('❌ API call vẫn thất bại:', newResponse.status);
        }
      } else {
        console.log('❌ Refresh token thất bại:', refreshData.message);
      }
    } else {
      console.log('❌ API call thất bại với status:', response.status);
    }
  } catch (error) {
    console.log('❌ Lỗi API call:', error);
  }
  
  console.log('=== Kết thúc test ===');
};

// Chạy test
testTokenExpiry(); 