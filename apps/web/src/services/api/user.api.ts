import axios from "../axios/customer.axios";
export interface Me {
  _id: string;
  name: string;
  email: string;
  avatarURL?: string;
  role: "user" | "admin";
  isActive: boolean;
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
export interface queryParams {
  limit: number;
  page: number;
  sort?: string;
  [key: string]: any;
}
export interface AllUserRespon {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: Me[];
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
  async getUsers(params: queryParams): Promise<AllUserRespon> {
    const URL_BACKEND = `/api/users/find-by-query`;
    const res = await axios.get(URL_BACKEND, { params });
    return res;
  }
  async removeUser(id: string) {
    const URL_BACKEND = `/api/users/remove/${id}`;
    const res = await axios.post(URL_BACKEND);
    return res;
  }

  async updateUser(
    id: string,
    data: Partial<Me>,
    imageFormData?: FormData
  ): Promise<any> {
    const formData = new FormData();

    // Gộp text fields vào formData
    for (const key in data) {
      if (data[key] !== undefined) {
        formData.append(key, data[key] as string);
      }
    }

    // Gắn thêm file nếu có
    if (imageFormData) {
      const imageFile = imageFormData.get("image");
      console.log("Image file from FormData:", imageFile); // vì Upload bạn đang dùng key là 'image'
      if (imageFile) {
        formData.append("avatar", imageFile);
      }
    }

    const res = await axios.patch(`/api/users/update/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return res;
  }
  async createUser(data: Partial<Me>, imageFormData?: FormData): Promise<any> {
    const URL_BACKEND = `/api/users`;
    const formData = new FormData();

    // Gộp text fields vào formData
    for (const key in data) {
      if (data[key] !== undefined) {
        formData.append(key, data[key] as string);
      }
    }

    // Gắn thêm file nếu có
    if (imageFormData) {
      const imageFile = imageFormData.get("image");
      console.log("Image file from FormData:", imageFile); // vì Upload bạn đang dùng key là 'image'
      if (imageFile) {
        formData.append("avatar", imageFile);
      }
    }

    const res = await axios.post(URL_BACKEND, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return res;
  }
}
// Create singleton instance
const userApiService = new UserApiService();

export default userApiService;
