import express from "express";
const getKid = async () => {
  const publickid = await fetch(
    "https://login.microsoftonline.com/common/discovery/v2.0/keys",
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
