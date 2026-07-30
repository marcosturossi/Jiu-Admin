// export const environment = {
//   production: true,
//   server: 'https://api.bjjclutch.com.br',
//   face_api: 'https://face-recognition.bjjclutch.com.br',
//   keycloak: {
//     url: 'https://auth.bjjclutch.com.br',
//     realm: 'platform-admin',
//     clientId: 'carlsongracie-app',
//   },
// };

export const environment = {
  production: false,
  server: 'http://localhost:9080',
  face_api: 'http://localhost:9080',
  keycloak: {
    url: 'http://localhost:8082',
    realm: 'platform-admin',
    clientId: 'carlsongracie-app',
  },
}

