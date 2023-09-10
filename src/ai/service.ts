
const endPoint = process.env.AI_ENDPOINT || "";
const completionModel = process.env.COMPLETION_MODEL || "";
const completionModelVersion = process.env.COMPLETION_MODEL_VERSION || "";

export const predictCompletion = (prompt: string) => {
  const completionEndPoint = `${endPoint}/${completionModel}/chat/completions?api-version=${completionModelVersion}`;
  console.log("url", completionEndPoint)
  const data = {
    "prompt": prompt,
    "max_tokens": 5,
  }
  fetch(completionEndPoint, {
    method: "post",
    headers: {
      "Authorization": "Bearer ",
      "api-key": "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data)
  }).then((res)=> {
    console.log("res>", res)
    return res.json()
  }).then((res)=> {
    console.log("result", res)
  }).catch((e)=> {
    console.log("error", e)
  });
}