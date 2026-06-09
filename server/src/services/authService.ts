import jwt from "jsonwebtoken";

const WX_APPID = process.env.WX_APPID;
const WX_SECRET = process.env.WX_SECRET;
const JWT_SECRET = process.env.JWT_SECRET;

interface WxSessionResponse {
  openid: string;
  session_key: string;
  errcode?: number;
  errmsg?: string;
}

interface WxPhoneResponse {
  errcode: number;
  errmsg: string;
  phone_info?: {
    phoneNumber: string;
    purePhoneNumber: string;
    countryCode: string;
  };
}

interface TokenPayload {
  userId: string;
  isPhoneVerified: boolean;
}

function getJwtSecret(): string {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }
  return JWT_SECRET;
}

export async function code2Session(code: string): Promise<{ openid: string; sessionKey: string }> {
  if (!WX_APPID || !WX_SECRET) {
    throw new Error("WX_APPID and WX_SECRET must be configured");
  }

  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${WX_APPID}&secret=${WX_SECRET}&js_code=${code}&grant_type=authorization_code`;

  const response = await fetch(url);
  const data: WxSessionResponse = await response.json() as WxSessionResponse;

  if (data.errcode) {
    throw new Error(`微信登录失败: ${data.errcode} ${data.errmsg}`);
  }

  return { openid: data.openid, sessionKey: data.session_key };
}

export async function getPhoneNumber(accessToken: string, phoneCode: string): Promise<string> {
  const url = `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${accessToken}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: phoneCode }),
  });

  const data: WxPhoneResponse = await response.json() as WxPhoneResponse;

  if (data.errcode !== 0) {
    if (data.errcode === -1) {
      throw new Error("Session过期，请重新登录");
    }
    throw new Error(`获取手机号失败: ${data.errcode} ${data.errmsg}`);
  }

  if (!data.phone_info) {
    throw new Error("获取手机号失败: 无手机号信息");
  }

  return data.phone_info.phoneNumber;
}

export async function getAccessToken(): Promise<string> {
  if (!WX_APPID || !WX_SECRET) {
    throw new Error("WX_APPID and WX_SECRET must be configured");
  }

  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${WX_APPID}&secret=${WX_SECRET}`;

  const response = await fetch(url);
  const data = await response.json() as { access_token?: string; errcode?: number; errmsg?: string };

  if (!data.access_token || data.errcode) {
    throw new Error(`获取 access_token 失败: ${data.errcode} ${data.errmsg}`);
  }

  return data.access_token;
}

export function generateToken(userId: string, isPhoneVerified: boolean): string {
  const payload: TokenPayload = { userId, isPhoneVerified };
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, getJwtSecret()) as TokenPayload;
}
