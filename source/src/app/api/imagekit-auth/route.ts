import ImageKit from "imagekit";
import { NextResponse } from "next/server";

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY ?? "",
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY ?? "",
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT ?? "",
});

// eslint-disable-next-line  @typescript-eslint/no-unused-vars
export async function GET(_request: Request) {
  const authParams = imagekit.getAuthenticationParameters()
  return NextResponse.json(authParams);
}