import { Button, Form, Input, Modal } from "antd";
interface CodeModalProps {
  modalVisible: boolean;
  setModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  codeForm: any;
  email: string;
  handleVerifyCode: any;
  authApiService: any;
}
const ModalGetCode: React.FC<CodeModalProps> = ({
  modalVisible,
  setModalVisible,
  codeForm,
  email,
  handleVerifyCode,
  authApiService,
}) => {
  return (
    <Modal
      title="Xác minh email"
      open={modalVisible}
      onCancel={() => setModalVisible(false)}
      onOk={() => codeForm.submit()}
      okText="Xác minh"
      cancelText="Hủy"
      maskClosable={false}
    >
      <p>
        Mã xác minh đã gửi tới email: <b>{email}</b>
      </p>

      <Form form={codeForm} layout="vertical" onFinish={handleVerifyCode}>
        <Form.Item
          name="code"
          rules={[{ required: true, message: "Vui lòng nhập mã xác minh" }]}
        >
          <Input className="w-full" placeholder="Nhập mã xác minh" />
        </Form.Item>
      </Form>
      <Button
        onClick={async () => {
          await authApiService.sendVerificationCodeAPI({ email: email });
        }}
      >
        Gửi lại mã
      </Button>
    </Modal>
  );
};
export default ModalGetCode;
