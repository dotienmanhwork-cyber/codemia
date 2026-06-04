import apiClient from "../../../shared/config/axios";

export const authApi = {
  login: (data) =>
    apiClient.post("/auth/login", data),

  register: (data) =>
    apiClient.post("/auth/register", data),

  // GET /users/my-profile  (thuộc UserController)
  getMyProfile: () =>
    apiClient.get("/users/my-profile"),

  // PUT /users/my-profile  (thuộc UserController)
  updateProfile: ({ fullName, bio, avatarUrl, bankAccountInfo }) =>
    apiClient.put("/users/my-profile", { fullName, bio, avatarUrl, bankAccountInfo }),

  // PUT /auth/my-profile/change-password  (thuộc AuthController — đã có)
  changePassword: ({ currentPw, newPw }) =>
    apiClient.put("/auth/my-profile/change-password", {
      oldPassword: currentPw,
      newPassword: newPw,
    }),
};