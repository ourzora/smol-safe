import { isAddress, parseEther } from "viem";

export const validateAddress = (address: string) => {
  if (!isAddress(address)) {
    return "Invalid address";
  }
};

export const validateETH = (value: string) => {
  try {
    parseEther(value);
  } catch (e: any) {
    return "ETH Value is Invalid";
  }
};
