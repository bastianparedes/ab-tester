export type TypeApiSessions = {
  logIn: {
    request: {
      body: {
        email: string;
        password: string;
      };
    };
    response: Record<string, never>;
  };
  logOut: {
    request: never;
    response: Record<string, never>;
  };
  refresh: {
    request: never;
    response: Record<string, never>;
  };
};
