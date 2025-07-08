export const getAccessToken = (): string | null => {
  return localStorage.getItem("access_token");
};

export const isAuthenticated = (): boolean => {
  const token = getAccessToken();
  return !!token;
};
