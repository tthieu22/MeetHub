import axios from "../axios/customer.axios";
export const getMyNotifications = async () => {
    const URL_BACKEND = `/api/notification/my`;
    const res = await axios.get(URL_BACKEND);
    return res;
  };

export const markAllNotificationsRead = async () => {
  const URL_BACKEND = `/api/notification/mark-read`;
  const res = await axios.put(URL_BACKEND);
  return res;
};