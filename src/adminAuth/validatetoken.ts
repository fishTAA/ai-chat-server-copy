import express from "express";
const getKid = async () => {
  const publickid = await fetch(
    "https://login.microsoftonline.com/d6b25047-e1c3-4aee-9ecb-b87eb750e861/discovery/keys?appid=dbd4e6df-ae87-427d-a5a1-2dc06f241a24",
    {
      method: "get",
    }
  );
  const publickidjson = await publickid.json();
  return publickidjson;
};
export const ValidateToken = async (token) => {
  const kid = token.header.kid;
  const publickidjson = await getKid();
  console.log("token kid" + kid);
  console.log("public kid" + publickidjson.keys[1].kid);
  if (kid == publickidjson.keys[1].kid) {
    console.log("Valid Token");

    return true;
  } else {
    return false;
  }
};
