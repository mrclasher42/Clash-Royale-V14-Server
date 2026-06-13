const tokenCharset = "0123456789abcdefghijklmnopqrstuvwxyz";

export function generateToken(): string {
  let token = "";
  for (let i = 0; i < 20; i++) {
    token += tokenCharset.charAt(Math.floor(Math.random() * tokenCharset.length));
  }
  return token;
}

