const prefix = '/auth';

export const sessionsUrls = {
  logIn: `${prefix}/session`,
  logOut: `${prefix}/session`,
  refreshAccessToken: `${prefix}/session/refresh`,
};
