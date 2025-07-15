import axios from "../axios/customer.axios";
export interface Me {
  _id: string;
  name: string;
  email: string;
  avatarURL?: string;
  role: "user" | "admin";
  createdAt: string;
  updatedAt: string;
}
export interface UploadImageRespon {
  success: boolean;
  data: {
    savedImage: Image;
  };
}

export interface Image {
  public_id: string;
  url: string;
  format: string;
  resource_type: string;
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}
class UserApiService {
  async getMeAPI(): Promise<Me> {
    const URL_BACKEND = `/api/users/me`;
    const response = await axios.get(URL_BACKEND);
    return response;
  }
  async updateMeAPI(payload: Partial<Me>): Promise<Me> {
    const URL_BACKEND = `/api/users/me`;
    const response = await axios.patch(URL_BACKEND, payload);
    return response;
  }
  async uploadImage(formData: FormData): Promise<UploadImageRespon> {
    const URL_BACKEND = `/api/upload/image`;
    const response = await axios.post(URL_BACKEND, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response;
  }
}
// Create singleton instance
const userApiService = new UserApiService();

export default userApiService;
