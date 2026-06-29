var http = require("http");
var token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiZTIwODBmMC03NGVlLTQwOGItYTk1Yy00ZjBkZGYxN2NiMTUiLCJ1c2VybmFtZSI6InNhbGVzX3Rlc3QiLCJyb2xlIjoidXNlciIsIm5hbWUiOiLplIDllK7mtYvor5XlkZgiLCJpYXQiOjE3ODI3MzIxNTQsImV4cCI6MTc4MzMzNjk1NH0.MvcjLMFgg_ojLWoQa_XGGCh4QGSlWLRjT1DomRidynM";
// Also decode JWT
var parts = token.split(".");
var payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
console.log("JWT name:", payload.name, "| bytes:", Buffer.from(payload.name).toString("hex"));
console.log("JWT role:", payload.role);