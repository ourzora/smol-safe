import { isAddress, parseEther } from "viem";
import { string } from "yup";

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

export const yupAddress = string()
  .matches(/^0x[a-fA-F0-9]{40}$/, "Needs to be a valid address")
  .required();
