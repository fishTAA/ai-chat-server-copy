const jwksClient = require("jwks-rsa");
const jwksUri =
  "https://login.microsoftonline.com/%7Bd6b25047-e1c3-4aee-9ecb-b87eb750e861%7D/discovery/keys?appid=%7Bdbd4e6df-ae87-427d-a5a1-2dc06f241a24%7D";

const client = jwksClient({
  jwksUri: jwksUri,
});

export const getKey = (header, callback) => {
  client.getSigningKey(header.kid, function (err, key) {
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
};
