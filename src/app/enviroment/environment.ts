export const environment = {
  production: false,
  keycloak: {
    authority: 'http://localhost:8080',
    redirectUri: 'http://localhost:4200/system',
    postLogoutRedirectUri: 'http://localhost:4200/logout',
    realm: 'pixel-dash',
    clientId: 'app-pixel-dash',
  }
};
