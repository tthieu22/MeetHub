import React from 'react';

interface ModalCustomProps {
  title?: string;
  open: boolean;
  onCancel: () => void;
  footer?: React.ReactNode;
  width?: number | string;
  centered?: boolean;
  destroyOnClose?: boolean;
  children: React.ReactNode;
}

// Modal custom đơn giản, không phụ thuộc antd
const ModalCustom: React.FC<ModalCustomProps> = ({
  title,
  open,
  onCancel,
  footer,
  width = 600,
  centered = true,
  children,
}) => {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.3)',
      zIndex: 1000,
      display: 'flex',
      alignItems: centered ? 'center' : 'flex-start',
      justifyContent: 'center',
      overflow: 'auto',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 8,
        width: width,
        maxWidth: '95vw',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        padding: 24,
        marginTop: centered ? 0 : 60,
        position: 'relative',
      }}>
        {/* Nút đóng */}
        <button
          onClick={onCancel}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'transparent',
            border: 'none',
            fontSize: 20,
            cursor: 'pointer',
          }}
          aria-label="Đóng"
        >
          ×
        </button>
        {/* Tiêu đề */}
        {title && <h2 style={{ marginTop: 0 }}>{title}</h2>}
        {/* Nội dung */}
        <div>{children}</div>
        {/* Footer */}
        {footer && (
          <div style={{ marginTop: 24, textAlign: 'right' }}>{footer}</div>
        )}
      </div>
    </div>
  );
};

export default ModalCustom; 